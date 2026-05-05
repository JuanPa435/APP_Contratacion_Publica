from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserBase(BaseModel):
    nombre: str
    email: EmailStr


class UserCreate(UserBase):
    password: str
    codigo_registro: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserRead(UserBase):
    id: int
    rol: str

    model_config = ConfigDict(from_attributes=True)


class RegistrationCodeCreate(BaseModel):
    codigo: str | None = None
    rol: Literal["admin", "auditor", "empleado", "analista"]
    descripcion: str | None = None


class RegistrationCodeRead(BaseModel):
    id: int
    codigo: str
    rol: str
    descripcion: str | None = None
    activo: bool
    creado_en: datetime
    usado_en: datetime | None = None

    model_config = ConfigDict(from_attributes=True)


class ContractBase(BaseModel):
    codigo_proceso: str
    entidad: str
    titulo: str
    descripcion: str | None = None
    proveedor: str | None = None
    modalidad: str | None = None
    departamento: str | None = None
    valor: float | None = None
    fecha_publicacion: datetime | None = None
    fecha_adjudicacion: datetime | None = None
    duracion_dias: int | None = None
    num_ofertas: int | None = None
    num_proponentes: int | None = None
    num_modificaciones: int | None = None
    datos_secop: dict[str, Any] = Field(default_factory=dict)


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int
    score_anomalia: float | None = None
    es_anomalo: bool = False
    alerta_generada: bool = False

    model_config = ConfigDict(from_attributes=True)


class AlertRead(BaseModel):
    id: int
    contrato_id: int
    nivel: str
    mensaje: str
    score: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AnalysisSummary(BaseModel):
    total_contratos: int
    total_anomalias: int
    contamination: float


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BulkContractImport(BaseModel):
    contratos: list[ContractBase]


class AnalysisRunRequest(BaseModel):
    contamination: float = 0.12