from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import LogAuditoria, Usuario

router = APIRouter()


class LogAuditoriaRead:
    def __init__(self, log):
        self.id = log.id
        self.usuario_id = log.usuario_id
        self.usuario_nombre = log.usuario.nombre
        self.accion = log.accion
        self.entidad = log.entidad
        self.entidad_id = log.entidad_id
        self.cambios = log.cambios
        self.created_at = log.created_at.isoformat()


@router.get("/logs", status_code=status.HTTP_200_OK)
def obtener_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    accion: str | None = None,
    usuario_id: int | None = None,
    dias_atras: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Obtener logs de auditoría con filtros"""
    query = db.query(LogAuditoria)

    fecha_inicio = datetime.utcnow() - timedelta(days=dias_atras)
    query = query.filter(LogAuditoria.created_at >= fecha_inicio)

    if accion:
        query = query.filter(LogAuditoria.accion == accion)
    if usuario_id:
        query = query.filter(LogAuditoria.usuario_id == usuario_id)

    logs = query.order_by(LogAuditoria.created_at.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id": log.id,
            "usuario_id": log.usuario_id,
            "usuario_nombre": log.usuario.nombre,
            "accion": log.accion,
            "entidad": log.entidad,
            "entidad_id": log.entidad_id,
            "cambios": log.cambios,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]


@router.get("/logs/resumen", status_code=status.HTTP_200_OK)
def resumen_logs(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
):
    """Obtener resumen de logs de auditoría"""
    total = db.query(LogAuditoria).count()
    por_accion = {}
    for accion in ["CREATE", "UPDATE", "DELETE"]:
        por_accion[accion] = db.query(LogAuditoria).filter(LogAuditoria.accion == accion).count()

    ultimas_24h = db.query(LogAuditoria).filter(
        LogAuditoria.created_at >= datetime.utcnow() - timedelta(days=1)
    ).count()

    return {
        "total": total,
        "ultimas_24_horas": ultimas_24h,
        "por_accion": por_accion,
    }
