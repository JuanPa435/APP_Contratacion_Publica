from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, conint


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
    codigo_proceso: str = Field(..., max_length=120)
    entidad: str = Field(..., max_length=255)
    titulo: str = Field(..., max_length=255)
    descripcion: str | None = Field(None, max_length=1000)
    proveedor: str | None = Field(None, max_length=255)
    modalidad: str | None = Field(None, max_length=120)
    departamento: str | None = Field(None, max_length=120)
    valor: float | None = Field(None, ge=0)
    fecha_publicacion: datetime | None = None
    fecha_adjudicacion: datetime | None = None
    duracion_dias: int | None = Field(None, ge=0)
    num_ofertas: int | None = Field(None, ge=0)
    num_proponentes: int | None = Field(None, ge=0)
    num_modificaciones: int | None = Field(None, ge=0)
    datos_secop: dict[str, Any] = Field(default_factory=dict)


class ContractCreate(ContractBase):
    pass


class ContractRead(ContractBase):
    id: int
    score_anomalia: float | None = None
    es_anomalo: bool = False
    alerta_generada: bool = False

    model_config = ConfigDict(from_attributes=True)


class AlertCreate(BaseModel):
    contrato_id: int
    nivel: Literal["baja", "media", "alta", "crítica"]
    mensaje: str = Field(..., min_length=1, max_length=500)
    score: float | None = Field(None, ge=-1, le=1)


class AlertRead(BaseModel):
    id: int
    contrato_id: int
    nivel: str
    mensaje: str
    score: float | None = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class SolicitudAuditoriaCreate(BaseModel):
    contrato_id: int
    motivo: str = Field(..., min_length=1, max_length=1000)
    evidencia: str | None = Field(None, max_length=1000)
    prioridad: Literal["baja", "media", "alta"] = "media"


class SolicitudAuditoriaUpdate(BaseModel):
    estado: Literal["pendiente", "en_proceso", "completada", "rechazada"] | None = None
    comentarios: str | None = Field(None, max_length=1000)
    assigned_to: int | None = None


class SolicitudAuditoriaRead(BaseModel):
    id: int
    contrato_id: int
    usuario_id: int
    motivo: str
    evidencia: str | None = None
    prioridad: str
    estado: str
    comentarios: str | None = None
    assigned_to: int | None = None
    created_at: datetime
    updated_at: datetime

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