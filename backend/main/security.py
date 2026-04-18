from cryptography.fernet import Fernet
from main.config import APP_ENCRYPTION_KEY


def _get_fernet() -> Fernet | None:
    if not APP_ENCRYPTION_KEY:
        return None
    try:
        return Fernet(APP_ENCRYPTION_KEY.encode("utf-8"))
    except Exception:
        return None


def encrypt_value(value: str) -> str:
    fernet = _get_fernet()
    if not fernet:
        return value
    return fernet.encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_value(value: str) -> str:
    fernet = _get_fernet()
    if not fernet:
        return value
    try:
        return fernet.decrypt(value.encode("utf-8")).decode("utf-8")
    except Exception:
        return value
