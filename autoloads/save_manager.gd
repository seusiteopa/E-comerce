extends Node

## SaveManager — GDD seção 3.10 / Arquitetura Técnica (Etapa 4, módulo 11 e seção 3).
## Save versionado desde a v1, para permitir migração em versões futuras
## sem quebrar o progresso de jogadores antigos (Arquitetura de Escalabilidade, Etapa 2/4).

signal jogo_salvo()
signal jogo_carregado()

const CAMINHO_SAVE: String = "user://save_data.json"
const VERSAO_SAVE: int = 1

func salvar(dados_jogo: Dictionary) -> bool:
	var pacote := {
		"versao_save": VERSAO_SAVE,
		"dinheiro": dados_jogo.get("dinheiro", 0),
		"reputacao": dados_jogo.get("reputacao", 0),
		"patrimonio": dados_jogo.get("patrimonio", 0),
		"itens": dados_jogo.get("itens", []),
		"missoes_concluidas": dados_jogo.get("missoes_concluidas", []),
		"posicao_x": dados_jogo.get("posicao_x", 0.0),
		"posicao_y": dados_jogo.get("posicao_y", 0.0),
	}

	var arquivo := FileAccess.open(CAMINHO_SAVE, FileAccess.WRITE)
	if arquivo == null:
		push_error("SaveManager: não foi possível abrir '%s' para escrita (erro %d)." % [CAMINHO_SAVE, FileAccess.get_open_error()])
		return false

	arquivo.store_string(JSON.stringify(pacote))
	arquivo.close()
	jogo_salvo.emit()
	return true

## Retorna um Dictionary vazio se não houver save ou se ele estiver corrompido —
## quem chamar deve tratar dicionário vazio como "nenhum progresso salvo".
func carregar() -> Dictionary:
	if not existe_save():
		return {}

	var arquivo := FileAccess.open(CAMINHO_SAVE, FileAccess.READ)
	if arquivo == null:
		push_error("SaveManager: não foi possível abrir '%s' para leitura." % CAMINHO_SAVE)
		return {}

	var texto := arquivo.get_as_text()
	arquivo.close()

	var resultado: Variant = JSON.parse_string(texto)
	if resultado == null or typeof(resultado) != TYPE_DICTIONARY:
		push_error("SaveManager: save em '%s' está corrompido ou ilegível." % CAMINHO_SAVE)
		return {}

	jogo_carregado.emit()
	return resultado

func existe_save() -> bool:
	return FileAccess.file_exists(CAMINHO_SAVE)

func apagar_save() -> void:
	if existe_save():
		DirAccess.remove_absolute(ProjectSettings.globalize_path(CAMINHO_SAVE))
