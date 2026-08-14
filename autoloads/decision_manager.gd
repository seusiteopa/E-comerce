extends Node

## DecisionManager — GDD seção 3.5.
## Aplica o efeito de uma opção escolhida aos sistemas de Economia e Progressão.
## É aqui que "Decidir → Agir → Ver resultado" (loop principal, Etapa 2) acontece de fato.

signal decisao_resolvida(id_evento: String, id_opcao: int, resultado_aplicado: bool)

func resolver_opcao(evento: DecisionEventData, indice_opcao: int) -> Dictionary:
	if indice_opcao < 0 or indice_opcao >= evento.opcoes.size():
		push_error("DecisionManager: índice de opção inválido para o evento '%s'." % evento.id)
		return {"aplicado": false}

	var opcao: DecisionOptionData = evento.opcoes[indice_opcao]

	# Rola a probabilidade — resultado só existe depois da escolha (GDD seção 3.5),
	# nunca é revelado como preview antes.
	var sucesso: bool = randf() <= opcao.probabilidade_resultado

	var resultado := {"aplicado": sucesso, "efeito_dinheiro": 0, "efeito_reputacao": 0}

	if sucesso:
		if opcao.efeito_dinheiro > 0:
			EconomyManager.adicionar(opcao.efeito_dinheiro)
		elif opcao.efeito_dinheiro < 0:
			EconomyManager.gastar(-opcao.efeito_dinheiro)

		if opcao.efeito_reputacao != 0:
			ProgressionManager.adicionar_reputacao(opcao.efeito_reputacao)

		resultado.efeito_dinheiro = opcao.efeito_dinheiro
		resultado.efeito_reputacao = opcao.efeito_reputacao

	decisao_resolvida.emit(evento.id, indice_opcao, sucesso)
	return resultado
