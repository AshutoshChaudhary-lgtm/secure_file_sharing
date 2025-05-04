"""
Monkey patch to fix Python 3.13 compatibility issues with older packages
Specifically addresses the pkgutil.ImpImporter missing attribute issue
"""
import sys
import pkgutil
import importlib.machinery
import zipimport

# Create a simple replacement for the removed ImpImporter class
class ImpImporter:
    """
    Compatibility shim for the removed pkgutil.ImpImporter in Python 3.13+
    """
    def __init__(self, path=None):
        self.path = path

    def find_module(self, fullname, path=None):
        return None

# Add the missing ImpImporter to pkgutil module
pkgutil.ImpImporter = ImpImporter

# Make sure pkg_resources works properly with our monkey patch
try:
    import pkg_resources
    # Re-register finders that might have failed during initial import
    if hasattr(pkg_resources, 'register_finder') and hasattr(pkg_resources, 'find_on_path'):
        pkg_resources.register_finder(pkgutil.ImpImporter, pkg_resources.find_on_path)
        pkg_resources.register_finder(zipimport.zipimporter, pkg_resources.find_eggs_in_zip)
        pkg_resources.register_finder(importlib.machinery.FileFinder, pkg_resources.find_on_path)
except ImportError:
    pass

print("Applied Python 3.13 compatibility monkey patches")