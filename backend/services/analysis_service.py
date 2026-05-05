from __future__ import annotations

from dataclasses import dataclass

import numpy as np
from sklearn.ensemble import IsolationForest

from backend.models import Contrato


FEATURE_NAMES = [
    "valor",
    "duracion_dias",
    "num_ofertas",
    "num_proponentes",
    "num_modificaciones",
    "titulo_len",
    "descripcion_len",
    "proveedor_len",
]


@dataclass
class AnalysisResult:
    contrato_id: int
    score: float
    es_anomalo: bool
    nivel: str
    mensaje: str


def _safe_number(value: object) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float, np.number)):
        return float(value)
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def contract_to_features(contract: Contrato) -> list[float]:
    return [
        _safe_number(contract.valor),
        _safe_number(contract.duracion_dias),
        _safe_number(contract.num_ofertas),
        _safe_number(contract.num_proponentes),
        _safe_number(contract.num_modificaciones),
        float(len(contract.titulo or "")),
        float(len(contract.descripcion or "")),
        float(len(contract.proveedor or "")),
    ]


def score_contracts(contracts: list[Contrato], contamination: float) -> list[AnalysisResult]:
    if not contracts:
        return []

    if len(contracts) < 2:
        contract = contracts[0]
        return [
            AnalysisResult(
                contrato_id=contract.id,
                score=0.0,
                es_anomalo=False,
                nivel="info",
                mensaje="Se requiere más de un contrato para entrenar Isolation Forest.",
            )
        ]

    matrix = np.array([contract_to_features(contract) for contract in contracts], dtype=float)
    model = IsolationForest(
        n_estimators=200,
        contamination=max(0.01, min(contamination, 0.49)),
        random_state=42,
    )
    predictions = model.fit_predict(matrix)
    scores = model.decision_function(matrix)

    results: list[AnalysisResult] = []
    for contract, prediction, score in zip(contracts, predictions, scores, strict=False):
        es_anomalo = bool(prediction == -1)
        nivel = "alta" if es_anomalo and score < -0.1 else "media" if es_anomalo else "baja"
        mensaje = "Posible irregularidad detectada" if es_anomalo else "Comportamiento dentro de lo esperado"
        results.append(
            AnalysisResult(
                contrato_id=contract.id,
                score=float(score),
                es_anomalo=es_anomalo,
                nivel=nivel,
                mensaje=mensaje,
            )
        )

    return results