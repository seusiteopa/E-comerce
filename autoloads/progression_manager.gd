extends Node

## ProgressionManager — GDD seção 3.7.
## Métrica dupla: Patrimônio (dinheiro + bens) e Reputação — duas curvas
## separadas para o jogo não virar "só acumular número" (GDD, seção 3.7).

signal marco_atingido(tipo: String, valor: int)

var _reputacao: int = 0
var _patrimonio_total: int = 0

## Marcos de patrimônio que desbloqueiam algo (GDD seção 4).
## Valores ilustrativos — balanceamento final é pendência registrada na Etapa 3/4.
const MARCOS_PATRIMONIO: Array[int] = [100, 500, 1500]
var _marcos_atingidos: Array[int] = []

func atualizar_patrimonio(dinheiro_atual: int, valor_bens: int = 0) -> void:
	_patrimonio_total = dinheiro_atual + valor_bens
	_checar_marcos()

func adicionar_reputacao(valor: int) -> void:
	_reputacao += valor
	if _reputacao < 0:
		_reputacao = 0

func obter_reputacao() -> int:
	return _reputacao

func obter_patrimonio() -> int:
	return _patrimonio_total

## Reinicia o estado — usado para "novo jogo" e para simulações de balanceamento (Etapa 9).
func reiniciar() -> void:
	_reputacao = 0
	_patrimonio_total = 0
	_marcos_atingidos.clear()

func _checar_marcos() -> void:
	for marco in MARCOS_PATRIMONIO:
		if _patrimonio_total >= marco and not _marcos_atingidos.has(marco):
			_marcos_atingidos.append(marco)
			marco_atingido.emit("patrimonio", marco)
