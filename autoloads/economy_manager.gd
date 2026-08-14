extends Node

## EconomyManager — GDD seção 3.6, Arquitetura Técnica seção 5.
## Fonte única de verdade sobre dinheiro do jogador.
## Regra permanente: nenhuma moeda do jogo é comprável com dinheiro real.

signal dinheiro_alterado(novo_valor: int)

var _dinheiro: int = 0

func inicializar(dinheiro_inicial: int) -> void:
	_dinheiro = dinheiro_inicial
	dinheiro_alterado.emit(_dinheiro)

func obter_dinheiro() -> int:
	return _dinheiro

## Adiciona dinheiro (venda, recompensa de missão, resultado positivo de decisão).
func adicionar(valor: int) -> void:
	if valor < 0:
		push_warning("EconomyManager.adicionar recebeu valor negativo (%d) — use gastar() para saídas." % valor)
		return
	_dinheiro += valor
	dinheiro_alterado.emit(_dinheiro)

## Tenta gastar dinheiro (compra, custo operacional, resultado negativo de decisão).
## Retorna true se a transação foi possível, false se não havia saldo suficiente.
## É essa checagem que impede saldo negativo — trabalha a competência de planejamento
## (GDD seção 9) de forma mecânica, não explicada em texto.
func gastar(valor: int) -> bool:
	if valor < 0:
		push_warning("EconomyManager.gastar recebeu valor negativo (%d)." % valor)
		return false
	if valor > _dinheiro:
		return false
	_dinheiro -= valor
	dinheiro_alterado.emit(_dinheiro)
	return true

func pode_pagar(valor: int) -> bool:
	return valor <= _dinheiro
