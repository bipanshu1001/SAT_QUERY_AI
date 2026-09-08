"""
DOFA-Style Dynamic Wavelength & GSD Conditioned ViT Encoder.

References:
- DOFA: Dynamic One-For-All Earth Observation Pre-training (Wang et al., 2024)
- OFA / SatMAE / RemoteCLIP

Key Innovation:
Instead of fixed 3-channel RGB or 12-channel static weights, DOFA dynamically
generates patch projection weights conditioned on the exact physical central
wavelengths (µm) and spatial resolution GSD (meters).
"""

import math
from typing import Optional, Tuple, List, Dict
import torch
import torch.nn as nn
import torch.nn.functional as F


def continuous_fourier_embedding(x: torch.Tensor, dim: int = 128, max_period: float = 10000.0) -> torch.Tensor:
    """
    Computes sinusoidal / Fourier features for continuous scalar inputs (e.g. wavelength in µm).
    x: [..., 1] or [...]
    Returns: [..., dim]
    """
    if x.dim() == 1:
        x = x.unsqueeze(-1)
    half = dim // 2
    freqs = torch.exp(-math.log(max_period) * torch.arange(start=0, end=half, dtype=torch.float32, device=x.device) / half)
    args = x * freqs
    embedding = torch.cat([torch.sin(args), torch.cos(args)], dim=-1)
    if dim % 2 == 1:
        embedding = torch.cat([embedding, torch.zeros_like(embedding[..., :1])], dim=-1)
    return embedding


class DynamicPatchEmbed(nn.Module):
    """
    Conditioned Patch Embedding:
    Generates 2D convolution kernel weights W(lambda, gsd) for each input band.
    """
    def __init__(
        self,
        patch_size: int = 16,
        embed_dim: int = 768,
        wave_embed_dim: int = 128,
        gsd_embed_dim: int = 64,
    ):
        super().__init__()
        self.patch_size = patch_size
        self.embed_dim = embed_dim
        self.wave_embed_dim = wave_embed_dim
        self.gsd_embed_dim = gsd_embed_dim
        
        # Hypernetwork MLP to produce kernel weights of shape [embed_dim, 1, patch_size, patch_size] per band
        kernel_elements = embed_dim * 1 * patch_size * patch_size
        self.kernel_generator = nn.Sequential(
            nn.Linear(wave_embed_dim + gsd_embed_dim, 256),
            nn.GELU(),
            nn.Linear(256, 512),
            nn.GELU(),
            nn.Linear(512, kernel_elements),
        )
        
        # Dynamic bias per band
        self.bias_generator = nn.Sequential(
            nn.Linear(wave_embed_dim + gsd_embed_dim, 128),
            nn.GELU(),
            nn.Linear(128, embed_dim),
        )

    def forward(
        self,
        x: torch.Tensor,
        wavelengths: torch.Tensor,
        gsd: float,
    ) -> torch.Tensor:
        """
        x: [B, C, H, W]
        wavelengths: [C] or [B, C] in micrometers
        gsd: float (meters)
        Returns: [B, num_patches, embed_dim]
        """
        B, C, H, W = x.shape
        device = x.device
        
        if wavelengths.dim() == 1:
            wl = wavelengths.to(device)
        else:
            wl = wavelengths[0].to(device)

        # 1. Compute continuous Fourier embeddings
        wl_emb = continuous_fourier_embedding(wl, dim=self.wave_embed_dim)  # [C, wave_dim]
        gsd_tensor = torch.tensor([gsd], dtype=torch.float32, device=device).expand(C, 1)
        gsd_emb = continuous_fourier_embedding(gsd_tensor, dim=self.gsd_embed_dim)  # [C, gsd_dim]
        
        cond_emb = torch.cat([wl_emb, gsd_emb], dim=-1)  # [C, wave_dim + gsd_dim]
        
        # 2. Predict band-specific conv kernels
        # Kernels: [C, embed_dim, 1, patch_size, patch_size]
        kernels = self.kernel_generator(cond_emb).view(
            C, self.embed_dim, 1, self.patch_size, self.patch_size
        )
        biases = self.bias_generator(cond_emb)  # [C, embed_dim]

        # 3. Apply 2D conv per band and sum across channels
        # x: [B, C, H, W]
        patch_tokens = 0
        for c_idx in range(C):
            band_input = x[:, c_idx:c_idx+1, :, :]  # [B, 1, H, W]
            band_kernel = kernels[c_idx]  # [embed_dim, 1, P, P]
            band_bias = biases[c_idx]     # [embed_dim]
            
            # Conv2d output: [B, embed_dim, H/P, W/P]
            conv_out = F.conv2d(
                band_input,
                band_kernel,
                bias=band_bias,
                stride=self.patch_size,
                padding=0,
            )
            patch_tokens = patch_tokens + conv_out

        # Flatten spatial grid into sequence: [B, embed_dim, N_patches] -> [B, N_patches, embed_dim]
        B_out, E_out, H_p, W_p = patch_tokens.shape
        tokens = patch_tokens.flatten(2).transpose(1, 2)
        return tokens


class TransformerBlock(nn.Module):
    """Standard Transformer Encoder Block with Pre-LN."""
    def __init__(self, embed_dim: int = 768, num_heads: int = 12, mlp_ratio: float = 4.0):
        super().__init__()
        self.norm1 = nn.LayerNorm(embed_dim)
        self.attn = nn.MultiheadAttention(embed_dim, num_heads, batch_first=True)
        self.norm2 = nn.LayerNorm(embed_dim)
        self.mlp = nn.Sequential(
            nn.Linear(embed_dim, int(embed_dim * mlp_ratio)),
            nn.GELU(),
            nn.Linear(int(embed_dim * mlp_ratio), embed_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        norm_x = self.norm1(x)
        attn_out, _ = self.attn(norm_x, norm_x, norm_x)
        x = x + attn_out
        x = x + self.mlp(self.norm2(x))
        return x


class DOFAEncoder(nn.Module):
    """
    Complete DOFA ViT Encoder with continuous wavelength and GSD conditioning.
    """
    def __init__(
        self,
        img_size: int = 256,
        patch_size: int = 16,
        embed_dim: int = 768,
        depth: int = 12,
        num_heads: int = 12,
    ):
        super().__init__()
        self.img_size = img_size
        self.patch_size = patch_size
        self.embed_dim = embed_dim
        self.num_patches = (img_size // patch_size) ** 2
        
        self.dynamic_patch_embed = DynamicPatchEmbed(
            patch_size=patch_size,
            embed_dim=embed_dim,
        )
        
        self.cls_token = nn.Parameter(torch.zeros(1, 1, embed_dim))
        self.pos_embed = nn.Parameter(torch.randn(1, self.num_patches + 1, embed_dim) * 0.02)
        
        self.blocks = nn.ModuleList([
            TransformerBlock(embed_dim=embed_dim, num_heads=num_heads)
            for _ in range(depth)
        ])
        self.norm = nn.LayerNorm(embed_dim)

    def forward(
        self,
        x: torch.Tensor,
        wavelengths: torch.Tensor,
        gsd: float = 10.0,
    ) -> Dict[str, torch.Tensor]:
        """
        x: [B, C, H, W] or [B, 2, C, H, W] for bi-temporal inputs
        wavelengths: [C] in micrometers
        gsd: spatial resolution in meters
        """
        if x.dim() == 5:
            # Bi-temporal input [B, 2, C, H, W] -> process T1 and T2 and concatenate
            B, T, C, H, W = x.shape
            x_flat = x.view(B * T, C, H, W)
            out_flat = self.forward(x_flat, wavelengths, gsd)["last_hidden_state"]
            # [B, T * N_patches, E]
            tokens = out_flat.view(B, -1, self.embed_dim)
            cls_repr = tokens[:, 0]
            return {"last_hidden_state": tokens, "cls_token": cls_repr}

        B = x.shape[0]
        # Dynamic patch embedding
        tokens = self.dynamic_patch_embed(x, wavelengths, gsd)  # [B, N_patches, E]
        
        cls_tokens = self.cls_token.expand(B, -1, -1)
        x_seq = torch.cat((cls_tokens, tokens), dim=1)
        
        # Handle variable image sizes / interpolating position embeddings
        if x_seq.shape[1] == self.pos_embed.shape[1]:
            x_seq = x_seq + self.pos_embed
        else:
            # Linear slice or interpolation
            pos_emb = self.pos_embed[:, :x_seq.shape[1], :]
            x_seq = x_seq + pos_emb
            
        for blk in self.blocks:
            x_seq = blk(x_seq)
            
        x_seq = self.norm(x_seq)
        
        return {
            "last_hidden_state": x_seq[:, 1:],  # Patch tokens [B, N_patches, E]
            "cls_token": x_seq[:, 0],           # CLS token [B, E]
            "all_tokens": x_seq,
        }
