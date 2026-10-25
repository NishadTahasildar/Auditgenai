import enum


class RoleEnum(str, enum.Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    SOCIETY_ADMIN = "SOCIETY_ADMIN"
    ACCOUNTANT = "ACCOUNTANT"
    AUDITOR = "AUDITOR"
    RESIDENT = "RESIDENT"


class ResidentTypeEnum(str, enum.Enum):
    OWNER = "OWNER"
    TENANT = "TENANT"
    FAMILY_MEMBER = "FAMILY_MEMBER"
    OTHER = "OTHER"
