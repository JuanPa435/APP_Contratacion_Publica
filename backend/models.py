from sqlalchemy import JSON, Boolean, Column, DateTime, Float, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from backend.database import Base


class CodigoRegistro(Base):
    __tablename__ = "codigos_registro"

    id = Column(Integer, primary_key=True, index=True)
    codigo = Column(String(64), unique=True, index=True, nullable=False)
    rol = Column(String(30), nullable=False)
    descripcion = Column(String(255), nullable=True)
    activo = Column(Boolean, nullable=False, default=True)
    creado_por = Column(Integer, nullable=True)
    usado_por = Column(Integer, nullable=True)
    creado_en = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    usado_en = Column(DateTime(timezone=True), nullable=True)


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(150), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    rol = Column(String(30), nullable=False, default="auditor")
    activo = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    contratos = relationship("Contrato", back_populates="usuario")


class Contrato(Base):
    __tablename__ = "contratos"

    id = Column(Integer, primary_key=True, index=True)
    codigo_proceso = Column(String(120), unique=True, index=True, nullable=False)
    entidad = Column(String(255), index=True, nullable=False)
    titulo = Column(String(255), nullable=False)
    descripcion = Column(String(1000), nullable=True)
    proveedor = Column(String(255), nullable=True)
    modalidad = Column(String(120), nullable=True)
    departamento = Column(String(120), nullable=True)
    valor = Column(Float, nullable=True)
    fecha_publicacion = Column(DateTime(timezone=True), nullable=True)
    fecha_adjudicacion = Column(DateTime(timezone=True), nullable=True)
    duracion_dias = Column(Integer, nullable=True)
    num_ofertas = Column(Integer, nullable=True)
    num_proponentes = Column(Integer, nullable=True)
    num_modificaciones = Column(Integer, nullable=True)
    datos_secop = Column(JSON, nullable=False, default=dict)
    score_anomalia = Column(Float, nullable=True)
    es_anomalo = Column(Boolean, nullable=False, default=False)
    alerta_generada = Column(Boolean, nullable=False, default=False)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    usuario = relationship("Usuario", back_populates="contratos")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Alerta(Base):
    __tablename__ = "alertas"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False, index=True)
    nivel = Column(String(30), nullable=False)
    mensaje = Column(String(500), nullable=False)
    score = Column(Float, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class SolicitudAuditoria(Base):
    __tablename__ = "solicitudes_auditoria"

    id = Column(Integer, primary_key=True, index=True)
    contrato_id = Column(Integer, ForeignKey("contratos.id"), nullable=False, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    motivo = Column(String(1000), nullable=False)
    evidencia = Column(String(1000), nullable=True)
    prioridad = Column(String(30), nullable=False, default="media")
    estado = Column(String(30), nullable=False, default="pendiente")
    comentarios = Column(String(1000), nullable=True)
    assigned_to = Column(Integer, ForeignKey("usuarios.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    contrato = relationship("Contrato")
    usuario = relationship("Usuario", foreign_keys=[usuario_id])
    auditor = relationship("Usuario", foreign_keys=[assigned_to])


class ResultadoAnalisis(Base):
    __tablename__ = "resultados_analisis"

    id = Column(Integer, primary_key=True, index=True)
    total_contratos = Column(Integer, nullable=False)
    total_anomalias = Column(Integer, nullable=False)
    contamination = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class LogAuditoria(Base):
    __tablename__ = "logs_auditoria"

    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"), nullable=False, index=True)
    accion = Column(String(50), nullable=False, index=True)
    entidad = Column(String(100), nullable=False)
    entidad_id = Column(Integer, nullable=False)
    cambios = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    usuario = relationship("Usuario")
