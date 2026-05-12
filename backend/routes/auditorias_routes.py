from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import Contrato, SolicitudAuditoria, Usuario
from backend.schemas import (
    SolicitudAuditoriaCreate,
    SolicitudAuditoriaRead,
    SolicitudAuditoriaUpdate,
)

router = APIRouter()


@router.post("/solicitudes", response_model=SolicitudAuditoriaRead, status_code=status.HTTP_201_CREATED)
def crear_solicitud_auditoria(
    payload: SolicitudAuditoriaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> SolicitudAuditoria:
    """Crear una nueva solicitud de auditoría para un contrato"""
    contrato = db.query(Contrato).filter(Contrato.id == payload.contrato_id).first()
    if contrato is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contrato no encontrado",
        )

    solicitud = SolicitudAuditoria(
        contrato_id=payload.contrato_id,
        usuario_id=current_user.id,
        motivo=payload.motivo,
        evidencia=payload.evidencia,
        prioridad=payload.prioridad,
        estado="pendiente",
    )
    db.add(solicitud)
    db.commit()
    db.refresh(solicitud)
    return solicitud


@router.get("/solicitudes", response_model=list[SolicitudAuditoriaRead])
def obtener_solicitudes(
    estado: str | None = None,
    prioridad: str | None = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[SolicitudAuditoria]:
    """Obtener todas las solicitudes de auditoría con filtros opcionales"""
    query = db.query(SolicitudAuditoria)

    if estado:
        query = query.filter(SolicitudAuditoria.estado == estado)
    if prioridad:
        query = query.filter(SolicitudAuditoria.prioridad == prioridad)

    return query.offset(skip).limit(limit).all()


@router.get("/solicitudes/usuario/{usuario_id}", response_model=list[SolicitudAuditoriaRead])
def obtener_solicitudes_usuario(
    usuario_id: int,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
) -> list[SolicitudAuditoria]:
    """Obtener solicitudes de auditoría de un usuario específico"""
    return (
        db.query(SolicitudAuditoria)
        .filter(SolicitudAuditoria.usuario_id == usuario_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/solicitudes/{solicitud_id}", response_model=SolicitudAuditoriaRead)
def obtener_solicitud(
    solicitud_id: int,
    db: Session = Depends(get_db),
) -> SolicitudAuditoria:
    """Obtener una solicitud de auditoría específica"""
    solicitud = (
        db.query(SolicitudAuditoria)
        .filter(SolicitudAuditoria.id == solicitud_id)
        .first()
    )
    if solicitud is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud de auditoría no encontrada",
        )
    return solicitud


@router.patch("/solicitudes/{solicitud_id}", response_model=SolicitudAuditoriaRead)
def actualizar_solicitud(
    solicitud_id: int,
    payload: SolicitudAuditoriaUpdate,
    db: Session = Depends(get_db),
) -> SolicitudAuditoria:
    """Actualizar una solicitud de auditoría (estado, comentarios, asignación)"""
    solicitud = (
        db.query(SolicitudAuditoria)
        .filter(SolicitudAuditoria.id == solicitud_id)
        .first()
    )
    if solicitud is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Solicitud de auditoría no encontrada",
        )

    # Actualizar campos si se proporcionan
    if payload.estado is not None:
        solicitud.estado = payload.estado
    if payload.comentarios is not None:
        solicitud.comentarios = payload.comentarios
    if payload.assigned_to is not None:
        # Verificar que el auditor existe
        auditor = db.query(Usuario).filter(Usuario.id == payload.assigned_to).first()
        if auditor is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Auditor no encontrado",
            )
        solicitud.assigned_to = payload.assigned_to

    solicitud.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(solicitud)
    return solicitud


@router.get("/resumen", response_model=dict)
def obtener_resumen_auditorias(
    db: Session = Depends(get_db),
) -> dict:
    """Obtener resumen de solicitudes de auditoría"""
    total = db.query(SolicitudAuditoria).count()
    pendientes = db.query(SolicitudAuditoria).filter(
        SolicitudAuditoria.estado == "pendiente"
    ).count()
    en_proceso = db.query(SolicitudAuditoria).filter(
        SolicitudAuditoria.estado == "en_proceso"
    ).count()
    completadas = db.query(SolicitudAuditoria).filter(
        SolicitudAuditoria.estado == "completada"
    ).count()
    prioridad_alta = db.query(SolicitudAuditoria).filter(
        SolicitudAuditoria.prioridad == "alta"
    ).count()

    return {
        "total_solicitudes": total,
        "pendientes": pendientes,
        "en_proceso": en_proceso,
        "completadas": completadas,
        "prioridad_alta": prioridad_alta,
    }
