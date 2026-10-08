"""Keep the module names referenced by the controlled joblib artifact importable."""
from models.supervised import pipeline as _implementation

globals().update({name: value for name, value in vars(_implementation).items()
                  if not name.startswith('__')})
