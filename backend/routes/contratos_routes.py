from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.dependencies import get_current_user
from backend.models import Alerta, Contrato, Usuario
from backend.schemas import AlertRead, BulkContractImport, ContractBase, ContractRead


router = APIRouter()


@router.post("/", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(
    payload: ContractBase,
    db: Session = Depends(get_db),
    user: Usuario = Depends(get_current_user),
) -> Contrato:
    contract = db.query(Contrato).filter(Contrato.codigo_proceso == payload.codigo_proceso).first()
    if contract is None:
        contract = Contrato(
            codigo_proceso=payload.codigo_proceso,
            entidad=payload.entidad,
            titulo=payload.titulo,
            descripcion=payload.descripcion,
            proveedor=payload.proveedor,
            modalidad=payload.modalidad,
            departamento=payload.departamento,
            valor=payload.valor,
            fecha_publicacion=payload.fecha_publicacion,
            fecha_adjudicacion=payload.fecha_adjudicacion,
            duracion_dias=payload.duracion_dias,
            num_ofertas=payload.num_ofertas,
            num_proponentes=payload.num_proponentes,
            num_modificaciones=payload.num_modificaciones,
            datos_secop=payload.datos_secop,
            usuario_id=user.id,
        )
        db.add(contract)
    else:
        contract.entidad = payload.entidad
        contract.titulo = payload.titulo
        contract.descripcion = payload.descripcion
        contract.proveedor = payload.proveedor
        contract.modalidad = payload.modalidad
        contract.departamento = payload.departamento
        contract.valor = payload.valor
        contract.fecha_publicacion = payload.fecha_publicacion
        contract.fecha_adjudicacion = payload.fecha_adjudicacion
        contract.duracion_dias = payload.duracion_dias
        contract.num_ofertas = payload.num_ofertas
        contract.num_proponentes = payload.num_proponentes
        contract.num_modificaciones = payload.num_modificaciones
        contract.datos_secop = payload.datos_secop
        contract.usuario_id = user.id

    db.commit()
    db.refresh(contract)
    return contract


@router.post("/lote", response_model=list[ContractRead])
def import_contracts(
    payload: BulkContractImport,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
) -> list[Contrato]:
    results: list[Contrato] = []
    for contract_payload in payload.contratos:
        contract = db.query(Contrato).filter(Contrato.codigo_proceso == contract_payload.codigo_proceso).first()
        if contract is None:
            contract = Contrato(**contract_payload.model_dump())
            db.add(contract)
        else:
            for key, value in contract_payload.model_dump().items():
                setattr(contract, key, value)
        results.append(contract)
    db.commit()
    for contract in results:
        db.refresh(contract)
    return results


@router.get("/", response_model=list[ContractRead])
def list_contracts(
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    solo_anomalos: bool = False,
) -> list[Contrato]:
    query = db.query(Contrato)
    if solo_anomalos:
        query = query.filter(Contrato.es_anomalo.is_(True))
    return query.order_by(Contrato.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{contract_id}", response_model=ContractRead)
def get_contract(
    contract_id: int,
    db: Session = Depends(get_db),
    _: Usuario = Depends(get_current_user),
) -> Contrato:
    contract = db.get(Contrato, contract_id)
    if contract is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contrato no encontrado")
    return contract


@router.get("/alertas", response_model=list[AlertRead])
def list_alerts(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> list[Alerta]:
    return db.query(Alerta).order_by(Alerta.created_at.desc()).all()


@router.get("/resumen")
def contracts_summary(db: Session = Depends(get_db), _: Usuario = Depends(get_current_user)) -> dict[str, int]:
    total = db.query(Contrato).count()
    anomalos = db.query(Contrato).filter(Contrato.es_anomalo.is_(True)).count()
    alertas = db.query(Alerta).count()
    return {"total_contratos": total, "total_anomalos": anomalos, "alertas": alertas}