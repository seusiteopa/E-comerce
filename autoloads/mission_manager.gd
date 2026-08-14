extends Node

## MissionManager — GDD seção 8.
## Fase 1 é linear (tutorial natural); Fase 2 é livre — conforme decidido no GDD.

signal missao_concluida(mission_id: String)
signal fase_concluida(fase: String)

const MISSOES_FASE_1: Array[String] = [
	"conhecer_mentor",
	"primeira_venda",
	"primeira_compra",
	"primeira_decisao_risco",
	"abrir_ponto_venda",
]

const MISSOES_FASE_2: Array[String] = [
	"negociar_fornecedor",
	"contratar_ajudante",
	"evento_mercado_adverso",
	"revelar_area_bloqueada",
]

var _concluidas: Array[String] = []

func concluir(mission_id: String) -> void:
	if _concluidas.has(mission_id):
		return
	_concluidas.append(mission_id)
	missao_concluida.emit(mission_id)

	if _todas_concluidas(MISSOES_FASE_1) and not _concluidas.has("_fase1_marcada"):
		_concluidas.append("_fase1_marcada")
		fase_concluida.emit("fase_1")
	# Corrigido na Etapa 10: a Fase 2 só pode ser marcada como concluída depois da Fase 1 —
	# antes desta correção, completar as 4 missões da Fase 2 fora de ordem (algo impossível
	# no fluxo real do mundo, mas possível chamando concluir() diretamente) disparava
	# fase_concluida("fase_2") prematuramente, mesmo com a Fase 1 incompleta.
	elif _concluidas.has("_fase1_marcada") and _todas_concluidas(MISSOES_FASE_2) and not _concluidas.has("_fase2_marcada"):
		_concluidas.append("_fase2_marcada")
		fase_concluida.emit("fase_2")

func esta_concluida(mission_id: String) -> bool:
	return _concluidas.has(mission_id)

func obter_concluidas() -> Array[String]:
	return _concluidas.duplicate()

func carregar_concluidas(lista: Array[String]) -> void:
	_concluidas = lista.duplicate()

func progresso_fase(missoes_da_fase: Array[String]) -> float:
	if missoes_da_fase.is_empty():
		return 0.0
	var feitas := 0
	for m in missoes_da_fase:
		if esta_concluida(m):
			feitas += 1
	return float(feitas) / float(missoes_da_fase.size())

func _todas_concluidas(missoes: Array[String]) -> bool:
	for m in missoes:
		if not esta_concluida(m):
			return false
	return true
