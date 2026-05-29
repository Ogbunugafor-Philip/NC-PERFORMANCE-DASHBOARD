from pydantic import BaseModel, EmailStr, Field


class FirstLoginRequest(BaseModel):
    dao_code: str = Field(min_length=2, max_length=64)
    email: EmailStr


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=2, max_length=255, description="DAO code or email")
    password: str = Field(min_length=1, max_length=255)


class PasswordChangeRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=255)
    new_password: str = Field(min_length=8, max_length=255)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    requires_password_change: bool


class MessageResponse(BaseModel):
    message: str
