# mbia_transcriptvideo — Transcrição de vídeo

Aplicação local feita com IA para analisar trailers em vídeo MP4, reconhecer a fala em inglês e baixar as legendas em `video.srt`.

## Como iniciar

1. Instale o [Node.js](https://nodejs.org/) (versão 18 ou superior) e o [FFmpeg](https://ffmpeg.org/download.html), disponível no `PATH`.
2. Coloque o vídeo de entrada em `video/video.mp4`. O arquivo de vídeo é ignorado pelo Git e não será enviado ao repositório.
3. Abra um terminal nesta pasta e execute `npm start`.
4. Acesse <http://127.0.0.1:4173> no Chrome ou Edge.
5. Clique em **Transcrever em inglês**. Na primeira execução, é preciso estar conectado à internet para baixar o modelo de reconhecimento de fala.
6. Revise e edite o SRT diretamente na prévia. Para inserir uma legenda no início ou no fim, informe os tempos no formato `HH:MM:SS,mmm`, digite o texto e escolha a posição.
7. Clique em **Baixar legenda .srt** para baixar a versão atualizada.

O FFmpeg extrai o áudio localmente; o reconhecimento de fala é executado no navegador com Transformers.js e Whisper Tiny em inglês. O vídeo e o áudio permanecem na máquina e não são enviados a uma API. Depois que o modelo é armazenado no cache do navegador, a transcrição pode ser executada novamente sem baixar o modelo outra vez.
