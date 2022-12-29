import platform

from setuptools import setup
from setuptools_rust import Binding, RustExtension, RustBin, Strip

if platform.machine() in ["aarch64", "armv7", "s390x", "ppc64le", "ppc64"]:
    args = ["--no-default-features"]
else:
    args = []

# We can't specify this in pyproject.toml just yet: https://github.com/PyO3/setuptools-rust/issues/208
setup(
    name="ruff",
    rust_extensions=[
        RustBin("ruff", strip=Strip.Debug, args=args),
    ],
    packages=["ruff"],
    # rust extensions are not zip safe, just like C-extensions.
    zip_safe=False,
)
