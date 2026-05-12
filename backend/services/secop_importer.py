from __future__ import annotations

import csv
import re
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from backend.models import Contrato
from backend.schemas import ContractBase


def _clean_text(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    if not cleaned or cleaned.lower() in {"no definido", "n/a", "na"}:
        return None
    return cleaned


def _parse_number(value: str | None) -> float | None:
    if value is None:
        return None
    cleaned = re.sub(r"[^0-9,.-]", "", value)
    cleaned = cleaned.replace(".", "").replace(",", ".")
    if not cleaned or cleaned in {"-", "."}:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def _parse_int(value: str | None) -> int | None:
    number = _parse_number(value)
    if number is None:
        return None
    return int(round(number))


def _parse_date(value: str | None) -> datetime | None:
    cleaned = _clean_text(value)
    if cleaned is None:
        return None

    for date_format in ("%m/%d/%Y", "%Y-%m-%d", "%m/%d/%Y %H:%M:%S"):
        try:
            parsed = datetime.strptime(cleaned, date_format)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue

    return None


def contract_from_secop_row(row: dict[str, str], row_number: int) -> ContractBase:
    codigo_proceso = _clean_text(row.get("ID del Proceso")) or f"SECOP-{row_number}"
    entidad = _clean_text(row.get("Entidad")) or "Entidad sin nombre"
    titulo = _clean_text(row.get("Nombre del Procedimiento")) or codigo_proceso

    datos_secop = {
        "id_origen": codigo_proceso,
        "url_proceso": _clean_text(row.get("URLProceso")),
        "nit_entidad": _clean_text(row.get("Nit Entidad")),
        "unidad_contratacion": _clean_text(row.get("Nombre de la Unidad de Contratación")),
        "estado_procedimiento": _clean_text(row.get("Estado del Procedimiento")),
        "justificacion_modalidad": _clean_text(row.get("Justificación Modalidad de Contratación")),
        "tipo_contrato": _clean_text(row.get("Tipo de Contrato")),
        "precio_base": _parse_number(row.get("Precio Base")),
        "valor_total_adjudicacion": _parse_number(row.get("Valor Total Adjudicacion")),
        "unidad_duracion": _clean_text(row.get("Unidad de Duracion")),
        "fecha_apertura_efectiva": (
            parsed_opening.isoformat() if (parsed_opening := _parse_date(row.get("Fecha de Apertura Efectiva"))) else None
        ),
        "fila_origen": row_number,
    }

    fecha_publicacion = _parse_date(row.get("Fecha de Publicacion del Proceso"))
    fecha_adjudicacion = _parse_date(row.get("Fecha Adjudicacion"))

    return ContractBase(
        codigo_proceso=codigo_proceso,
        entidad=entidad,
        titulo=titulo,
        descripcion=_clean_text(row.get("Descripción del Procedimiento")),
        proveedor=_clean_text(row.get("Nombre del Proveedor Adjudicado")),
        modalidad=_clean_text(row.get("Modalidad de Contratacion")),
        departamento=_clean_text(row.get("Nombre de la Unidad de Contratación")),
        valor=_parse_number(row.get("Valor Total Adjudicacion")),
        fecha_publicacion=fecha_publicacion,
        fecha_adjudicacion=fecha_adjudicacion,
        duracion_dias=_parse_int(row.get("Duracion")),
        num_ofertas=_parse_int(row.get("Conteo de Respuestas a Ofertas")),
        num_proponentes=_parse_int(row.get("Proveedores que Manifestaron Interes")),
        num_modificaciones=0,
        datos_secop=datos_secop,
    )


def load_secop_csv(csv_path: str | Path) -> list[ContractBase]:
    path = Path(csv_path)
    contracts_by_code: dict[str, ContractBase] = {}

    with path.open("r", encoding="utf-8-sig", newline="") as file_handle:
        reader = csv.DictReader(file_handle)
        for row_number, row in enumerate(reader, start=1):
            contract = contract_from_secop_row(row, row_number)
            contracts_by_code[contract.codigo_proceso] = contract

    return list(contracts_by_code.values())


def upsert_contracts(db: Session, contracts: list[ContractBase], usuario_id: int | None = None) -> tuple[int, int]:
    created = 0
    updated = 0

    for contract_payload in contracts:
        contract = db.query(Contrato).filter(Contrato.codigo_proceso == contract_payload.codigo_proceso).first()
        contract_data = contract_payload.model_dump()

        if contract is None:
            contract = Contrato(**contract_data)
            if usuario_id is not None:
                contract.usuario_id = usuario_id
            db.add(contract)
            created += 1
        else:
            for key, value in contract_data.items():
                setattr(contract, key, value)
            if usuario_id is not None:
                contract.usuario_id = usuario_id
            updated += 1

    db.commit()
    return created, updated


def sync_secop_csv(db: Session, csv_path: str | Path, usuario_id: int | None = None) -> tuple[int, int]:
    contracts = load_secop_csv(csv_path)
    return upsert_contracts(db, contracts, usuario_id=usuario_id)