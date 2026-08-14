extends Node

## InventoryManager — GDD seção 3.3.
## Capacidade limitada por decisão de design (ensina priorização, não coleta ilimitada).

signal inventario_alterado()

const CAPACIDADE_INICIAL: int = 6  # valor ilustrativo, sujeito a balanceamento (Etapa 3)

var _capacidade: int = CAPACIDADE_INICIAL
var _itens: Array[String] = []  # ids de ItemData — v1 sem empilhamento de quantidade (decisão desta etapa, simplifica o MVP)

func inicializar(capacidade: int = CAPACIDADE_INICIAL, itens_iniciais: Array[String] = []) -> void:
	_capacidade = capacidade
	_itens = itens_iniciais.duplicate()
	inventario_alterado.emit()

func adicionar_item(item_id: String) -> bool:
	if _itens.size() >= _capacidade:
		return false
	_itens.append(item_id)
	inventario_alterado.emit()
	return true

func remover_item(item_id: String) -> bool:
	var indice := _itens.find(item_id)
	if indice == -1:
		return false
	_itens.remove_at(indice)
	inventario_alterado.emit()
	return true

func obter_itens() -> Array[String]:
	return _itens.duplicate()

func esta_cheio() -> bool:
	return _itens.size() >= _capacidade

func obter_capacidade() -> int:
	return _capacidade

func aumentar_capacidade(valor: int) -> void:
	if valor <= 0:
		push_warning("InventoryManager.aumentar_capacidade recebeu valor não positivo (%d)." % valor)
		return
	_capacidade += valor
	inventario_alterado.emit()
