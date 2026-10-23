#!/usr/bin/env bash
set -euo pipefail

# Assinatura de release sem enviar a chave privada para Github.
# Uso: ./scripts/assinar-aab-local.sh ./app-release.aab ./Rumo-Play-Upload-Key.jks ./Rumo-Play-0.1.0.aab
# O jarsigner pedirá a senha da chave de upload e NÃO a gravará no shell history.
INPUT_AAB="${1:-}"
KEYSTORE="${2:-}"
OUTPUT_AAB="${3:-Rumo-Play-Release.aab}"
ALIAS="rumo-upload"

if [[ -z "$INPUT_AAB" || -z "$KEYSTORE" || ! -f "$INPUT_AAB" || ! -f "$KEYSTORE" ]]; then
  echo "Uso: $0 <aab-sem-assinatura> <chave-upload.jks> [saida-assinada.aab]" >&2
  exit 2
fi

if [[ "$INPUT_AAB" == "$OUTPUT_AAB" ]]; then
  echo "A saída deve ser diferente da entrada." >&2
  exit 2
fi

if ! command -v jarsigner >/dev/null 2>&1; then
  echo "JDK com jarsigner não encontrado." >&2
  exit 2
fi

umask 077
jarsigner -keystore "$KEYSTORE" -sigalg SHA256withRSA -digestalg SHA-256 \
  -signedjar "$OUTPUT_AAB" "$INPUT_AAB" "$ALIAS"

# -strict garante que a assinatura/algoritmo não apresenta avisos críticos.
jarsigner -verify -strict -keystore "$KEYSTORE" "$OUTPUT_AAB"
echo "AAB assinado: $OUTPUT_AAB"
echo "SHA256 arquivo:"
sha256sum "$OUTPUT_AAB"
