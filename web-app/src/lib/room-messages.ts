export function getJoinRoomErrorMessage(error: string): string {
  if (error === "Room not found") {
    return "Não encontramos uma sala com esse código. Confira o PIN e tente novamente.";
  }

  if (error === "Room PIN is required" || error === "Invalid room PIN") {
    return "Digite um PIN válido com 6 números.";
  }

  if (error === "Cannot join room with status: in_progress") {
    return "Esta partida já começou e não está aceitando novos jogadores.";
  }

  if (error === "Cannot join room with status: finished") {
    return "Esta partida já foi encerrada.";
  }

  return "Confira o PIN e tente novamente. Se o problema continuar, fale com o anfitrião.";
}
