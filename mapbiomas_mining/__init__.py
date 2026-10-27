"""MapBiomas Mining: U-Net based mining mapping.

Heavy modules (TensorFlow, Earth Engine) are imported explicitly by the user, e.g.::

    from mapbiomas_mining.model import build_unet
    from mapbiomas_mining.predict import predict_mosaic
"""
from .config import MiningConfig

__version__ = "2.0.0"
__all__ = ["MiningConfig", "__version__"]
