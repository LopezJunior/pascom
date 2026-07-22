/* ==========================================================================
   PASCOM PARÓQUIA SANTO ANTÔNIO - SCRIPT PRINCIPAL
   ========================================================================== */

// 1. VARIÁVEIS GLOBAIS E CONFIGURAÇÕES
const urlApiGoogle =
  "https://script.google.com/macros/s/AKfycbwhTgBFYK7fLfACwa_8pr_0eLB5mZBt84ZvSy7fEriAwwcfm9URZUmjvSvjxXnON5Lu/exec";
const idDoCanal = "UC69U57tf2N9ULzxQSFiHR1Q";
const apiKeyYoutube = "AIzaSyB1QCuqtZow18mekFyw_EnAd-Fo92PoWVM";
const urlYoutubeFeed = `https://api.rss2json.com/v1/api.json?rss_url=https://www.youtube.com/feeds/videos.xml?channel_id=${idDoCanal}`;

let dadosDosAlbuns = [];
let fotosDoAlbumAtual = [];
let indiceFotoAtual = 0;

/* ==========================================================================
   2. INTEGRAÇÃO COM GOOGLE DRIVE E FILTROS DE ÁLBUNS
   ========================================================================== */

// Busca as pastas no Google Drive ao abrir o site
async function iniciarSite() {
  const containerLista = document.getElementById("lista-albuns");
  if (!containerLista) return;

  try {
    const resposta = await fetch(urlApiGoogle);
    dadosDosAlbuns = await resposta.json();
    containerLista.innerHTML = "";

    if (!dadosDosAlbuns || dadosDosAlbuns.length === 0) {
      containerLista.innerHTML =
        '<p style="text-align:center; width:100%; grid-column: 1/-1;">Nenhuma foto ou pasta encontrada.</p>';
      return;
    }

    // O TRUQUE MÁGICO: Guardamos a posição original de cada álbum.
    // Isso impede o bug de abrir o álbum errado quando a lista está filtrada!
    dadosDosAlbuns.forEach((album, i) => (album.indexOriginal = i));

    // Renderiza os álbuns exibindo todos por padrão
    renderizarAlbuns("todos");
  } catch (erro) {
    console.error("Erro ao buscar as imagens:", erro);
    containerLista.innerHTML =
      '<p style="text-align:center; width:100%; grid-column: 1/-1;">Erro ao conectar com o acervo da Pascom.</p>';
  }
}

// Renderiza os cartões com base no botão que o usuário clicou
function renderizarAlbuns(filtro) {
  const containerLista = document.getElementById("lista-albuns");
  const btnVerMais = document.getElementById("btn-ver-mais");
  containerLista.innerHTML = "";

  let albunsFiltrados = [];

  // Lógica inteligente de filtro baseada no texto do título do Drive
  if (filtro === "trezenas") {
    albunsFiltrados = dadosDosAlbuns.filter((a) =>
      a.titulo.toLowerCase().includes("trezena"),
    );
  } else if (filtro === "outros") {
    albunsFiltrados = dadosDosAlbuns.filter(
      (a) => !a.titulo.toLowerCase().includes("trezena"),
    );
  } else {
    albunsFiltrados = [...dadosDosAlbuns];
  }

  if (albunsFiltrados.length === 0) {
    containerLista.innerHTML =
      '<p style="text-align:center; width:100%; grid-column: 1/-1;">Nenhum álbum encontrado para esta categoria.</p>';
    if (btnVerMais) btnVerMais.style.display = "none";
    return;
  }

  const maxAlbuns = 6;

  albunsFiltrados.forEach((album, indexExibicao) => {
    if (!album.fotos || album.fotos.length === 0) return;

    const urlCapa = `https://drive.google.com/thumbnail?id=${album.fotos[0].id}&sz=w800`;
    const classeExtra = indexExibicao >= maxAlbuns ? "album-escondido" : "";
    const estiloOculto =
      indexExibicao >= maxAlbuns ? 'style="display: none;"' : "";

    // Atenção: O onclick chama o indexOriginal que salvamos lá em cima!
    const cardHTML = `
            <div class="card-album ${classeExtra}" ${estiloOculto} data-aos="fade-up" onclick="abrirAlbum(${album.indexOriginal})">
                <div class="card-img-wrapper">
                    <span class="badge-fotos"><i class="fa-regular fa-image"></i> ${album.fotos.length}</span>
                    <img src="${urlCapa}" alt="Capa do álbum ${album.titulo}" loading="lazy">
                </div>
                <div class="card-content">
                    <span class="card-date">ÁLBUM DA COMUNIDADE</span>
                    <h3>${album.titulo}</h3>
                    <button class="link-album btn-abrir">VER ÁLBUM <i class="fa-solid fa-arrow-right"></i></button>
                </div>
            </div>
        `;
    containerLista.innerHTML += cardHTML;
  });

  // Controla a aparição do botão Ver Mais para a lista recém filtrada
  if (albunsFiltrados.length > maxAlbuns && btnVerMais) {
    btnVerMais.style.display = "inline-flex";
    btnVerMais.onclick = () => {
      document
        .querySelectorAll(".album-escondido")
        .forEach((album) => (album.style.display = "block"));
      btnVerMais.style.display = "none";
    };
  } else if (btnVerMais) {
    btnVerMais.style.display = "none";
  }
}

// Disparada quando clica nos botões de filtro
window.filtrarAlbuns = function (filtro, botaoClicado) {
  // Tira a cor dourada de todos os botões e coloca só no que foi clicado
  document
    .querySelectorAll(".btn-filtro")
    .forEach((btn) => btn.classList.remove("ativo"));
  botaoClicado.classList.add("ativo");

  // Manda desenhar a tela novamente
  renderizarAlbuns(filtro);
};

// Abre a galeria de fotos de um álbum específico
function abrirAlbum(indexDoAlbum) {
  history.pushState({ tela: "album_aberto" }, "", "#album");
  const albumEscolhido = dadosDosAlbuns[indexDoAlbum];
  fotosDoAlbumAtual = albumEscolhido.fotos;

  const els = obterElementosInterface();
  if (!els.lista || !els.galeria) return;

  els.lista.style.display = "none";

  // A CORREÇÃO ESTÁ NESTA LINHA AQUI ↓
  els.galeria.style.display = "block"; // Mudou de "grid" para "block"

  if (els.btnVoltar) els.btnVoltar.style.display = "inline-block";
  if (els.btnVerMais) els.btnVerMais.style.display = "none";
  if (els.filtros) els.filtros.style.display = "none";
  if (els.titulo) els.titulo.innerText = albumEscolhido.titulo;

  els.galeria.innerHTML = "";

  albumEscolhido.fotos.forEach((foto, indexFoto) => {
    const urlFoto = `https://drive.google.com/thumbnail?id=${foto.id}&sz=w800`;
    els.galeria.innerHTML += `<img src="${urlFoto}" alt="Foto da Paróquia" loading="lazy" onclick="abrirLightbox(${indexFoto})">`;
  });

  document.getElementById("albuns").scrollIntoView({ behavior: "smooth" });
}

// Volta para a tela inicial de álbuns
function voltarParaAlbuns() {
  const els = obterElementosInterface();
  if (!els.galeria || !els.lista) return;

  els.galeria.style.display = "none";
  els.lista.style.display = "grid";
  if (els.btnVoltar) els.btnVoltar.style.display = "none";
  if (els.filtros) els.filtros.style.display = "flex"; // Devolve os botões de filtro
  if (els.titulo) els.titulo.innerText = "Momentos que ficaram para sempre";

  const temOculto = Array.from(
    document.querySelectorAll(".album-escondido"),
  ).some((a) => a.style.display === "none");
  if (temOculto && els.btnVerMais) els.btnVerMais.style.display = "inline-flex";
}

// Função auxiliar para mapear o HTML
function obterElementosInterface() {
  return {
    lista: document.getElementById("lista-albuns"),
    galeria: document.getElementById("galeria-fotos"),
    btnVoltar: document.getElementById("btn-voltar"),
    btnVerMais: document.getElementById("btn-ver-mais"),
    titulo: document.getElementById("titulo-sessao"),
    filtros: document.getElementById("filtros-albuns"),
  };
}

/* ==========================================================================
   3. LIGHTBOX (VISUALIZADOR DE TELA CHEIA ANIMADO E DOWNLOAD DIRECTO)
   ========================================================================== */

function precarregarImagensVizinhas(indexAtual) {
  if (fotosDoAlbumAtual.length === 0) return;
  const prox = indexAtual + 1 >= fotosDoAlbumAtual.length ? 0 : indexAtual + 1;
  const ant =
    indexAtual - 1 < 0 ? fotosDoAlbumAtual.length - 1 : indexAtual - 1;

  new Image().src = `https://drive.google.com/thumbnail?id=${fotosDoAlbumAtual[prox].id}&sz=w1600`;
  new Image().src = `https://drive.google.com/thumbnail?id=${fotosDoAlbumAtual[ant].id}&sz=w1600`;
}

function atualizarContadorLightbox() {
  const contador = document.getElementById("lightbox-counter");
  if (contador)
    contador.innerText = `${indiceFotoAtual + 1} / ${fotosDoAlbumAtual.length}`;
}

// NOVA FUNÇÃO: Força o telemóvel a descarregar a foto sem abrir o Google Drive
async function baixarFotoAtual(event) {
  event.preventDefault(); // Impede o navegador de tentar abrir hiperligações externas

  const btn = event.currentTarget;
  const icone = btn.querySelector("i");
  const classeOriginal = icone.className;

  // Altera o ícone para uma "rodinha de loading" para o utilizador perceber que está a transferir
  icone.className = "fa-solid fa-spinner fa-spin";

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  const url = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;

  try {
    // 1. Puxa a imagem pura em formato de dados (Blob)
    const resposta = await fetch(url);
    const blob = await resposta.blob();

    // 2. Cria um ficheiro temporário na memória do telemóvel/PC
    const blobUrl = window.URL.createObjectURL(blob);
    const linkFalso = document.createElement("a");
    linkFalso.style.display = "none";
    linkFalso.href = blobUrl;
    linkFalso.download = `Pascom_Imbituva_${idFoto}.jpg`; // Nome com que o ficheiro vai ser guardado

    // 3. Simula um clique invisível para forçar o download local
    document.body.appendChild(linkFalso);
    linkFalso.click();

    // 4. Limpa a memória para não deixar o site pesado
    document.body.removeChild(linkFalso);
    window.URL.revokeObjectURL(blobUrl);
  } catch (erro) {
    console.error(
      "Erro na transferência forçada. A usar método alternativo...",
      erro,
    );
    // Plano B: Se a internet falhar, abre pelo método normal (o que tinha antes)
    window.open(
      `https://docs.google.com/uc?export=download&id=${idFoto}`,
      "_blank",
    );
  } finally {
    icone.className = classeOriginal; // Devolve o ícone da nuvem com a seta
  }
}

function abrirLightbox(index) {
  indiceFotoAtual = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnDownload = document.getElementById("btn-download");

  if (!lightbox || !lightboxImg || !btnDownload) return;

  lightboxImg.classList.remove(
    "img-escondida-esquerda",
    "img-escondida-direita",
  );

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  lightboxImg.src = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;

  // LIGA O NOSSO BOTÃO DE DOWNLOAD À NOVA FUNÇÃO MÁGICA
  btnDownload.href = "#";
  btnDownload.onclick = baixarFotoAtual;

  atualizarContadorLightbox();
  lightbox.style.display = "flex";
  precarregarImagensVizinhas(indiceFotoAtual);
}

function fecharLightbox() {
  animando = false;
  const lightbox = document.getElementById("lightbox");
  if (lightbox) lightbox.style.display = "none";
  const img = document.getElementById("lightbox-img");
  if (img) img.src = "";
}

let animando = false;

function mudarFoto(direcao) {
  if (animando) return;
  animando = true;

  const img = document.getElementById("lightbox-img");

  let novoIndice = indiceFotoAtual + direcao;
  if (novoIndice >= fotosDoAlbumAtual.length) novoIndice = 0;
  else if (novoIndice < 0) novoIndice = fotosDoAlbumAtual.length - 1;

  const idFoto = fotosDoAlbumAtual[novoIndice].id;
  const novaUrl = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;

  if (direcao > 0) img.classList.add("img-escondida-esquerda");
  else img.classList.add("img-escondida-direita");

  const promessaImagem = new Promise((resolve) => {
    const tempImg = new Image();
    tempImg.onload = resolve;
    tempImg.onerror = resolve;
    tempImg.src = novaUrl;
  });

  const promessaAnimacao = new Promise((resolve) => setTimeout(resolve, 250));

  Promise.all([promessaImagem, promessaAnimacao]).then(() => {
    indiceFotoAtual = novoIndice;

    img.classList.remove("img-escondida-esquerda", "img-escondida-direita");
    img.classList.add(
      direcao > 0 ? "img-escondida-direita" : "img-escondida-esquerda",
    );

    img.src = novaUrl;

    if (typeof atualizarContadorLightbox === "function")
      atualizarContadorLightbox();
    if (typeof precarregarImagensVizinhas === "function")
      precarregarImagensVizinhas(indiceFotoAtual);

    void img.offsetWidth;

    img.classList.remove("img-escondida-esquerda", "img-escondida-direita");

    setTimeout(() => {
      animando = false;
    }, 300);
  });
}

let touchStartX = 0;
let touchEndX = 0;

function configurarSwipe() {
  const lightboxElement = document.getElementById("lightbox");
  if (!lightboxElement) return;

  lightboxElement.addEventListener(
    "touchstart",
    (e) => (touchStartX = e.changedTouches[0].screenX),
    { passive: true },
  );
  lightboxElement.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      const distanciaMinima = 50;
      if (touchEndX < touchStartX - distanciaMinima) mudarFoto(1);
      if (touchEndX > touchStartX + distanciaMinima) mudarFoto(-1);
    },
    { passive: true },
  );
}

/* ==========================================================================
   4. INTEGRAÇÃO COM YOUTUBE (VÍDEOS E LIVE)
   ========================================================================== */

function carregarVideosYouTube() {
  const gradeVideos = document.getElementById("grade-videos");
  if (!gradeVideos) return;

  fetch(urlYoutubeFeed)
    .then((res) => res.json())
    .then((dados) => {
      gradeVideos.innerHTML = "";
      if (!dados.items) return;

      const ultimosVideos = dados.items.slice(0, 10);
      ultimosVideos.forEach((video) => {
        const cardVideo = `
                    <div class="card-video" onclick="window.open('${video.link}', '_blank')">
                        <div class="thumbnail-wrapper">
                            <img src="${video.thumbnail}" alt="${video.title}" loading="lazy">
                            <div class="play-overlay"><i class="fa-solid fa-circle-play"></i></div>
                        </div>
                        <div class="video-info">
                            <h3>${video.title}</h3>
                        </div>
                    </div>
                `;
        gradeVideos.innerHTML += cardVideo;
      });
    })
    .catch((erro) => {
      console.error("Erro ao puxar vídeos:", erro);
      gradeVideos.innerHTML = "<p>Erro ao carregar os vídeos recentes.</p>";
    });
}

function verificarLive() {
  const urlBuscaLive = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${idDoCanal}&eventType=live&type=video&key=${apiKeyYoutube}`;
  const secaoLive = document.getElementById("secao-live");
  const iframeLive = document.getElementById("iframe-live");
  if (!secaoLive || !iframeLive) return;

  fetch(urlBuscaLive)
    .then((res) => res.json())
    .then((dados) => {
      if (dados.items && dados.items.length > 0) {
        iframeLive.src = `https://www.youtube.com/embed/${dados.items[0].id.videoId}?autoplay=1`;
        secaoLive.style.display = "block";
      } else {
        secaoLive.style.display = "none";
      }
    })
    .catch((erro) => console.error("Erro ao verificar a live:", erro));
}

/* ==========================================================================
   5. INTERAÇÕES GERAIS E INICIALIZAÇÃO (O MOTOR DO SITE)
   ========================================================================== */

// Modais
function abrirModalSobre(event) {
  if (event) event.preventDefault();
  const modal = document.getElementById("modal-sobre");
  if (modal) modal.style.display = "flex";
}

function fecharModalSobre() {
  const modal = document.getElementById("modal-sobre");
  if (modal) modal.style.display = "none";
}

// Animação dos Contadores Numéricos
function animarContadores() {
  document.querySelectorAll(".contador").forEach((contador) => {
    const velocidade = 100;
    const atualizarContador = () => {
      const alvo = +contador.getAttribute("data-alvo");
      const contagem = +contador.innerText;
      const incremento = alvo / velocidade;

      if (contagem < alvo) {
        contador.innerText = Math.ceil(contagem + incremento);
        setTimeout(atualizarContador, 20);
      } else {
        contador.innerText = alvo + "+";
      }
    };
    atualizarContador();
  });
}

// Inicia tudo quando a página carrega
document.addEventListener("DOMContentLoaded", () => {
  // 1. Dispara as requisições principais
  iniciarSite();
  carregarVideosYouTube();
  verificarLive();

  // 2. Configura o Carrossel de Vídeos
  const track = document.getElementById("grade-videos");
  const btnPrev = document.getElementById("btn-prev-video");
  const btnNext = document.getElementById("btn-next-video");

  if (btnPrev && btnNext && track) {
    btnNext.addEventListener("click", () =>
      track.scrollBy({ left: 320, behavior: "smooth" }),
    );
    btnPrev.addEventListener("click", () =>
      track.scrollBy({ left: -320, behavior: "smooth" }),
    );
  }

  // 3. Configurações de Acessibilidade e Toque (Swipe)
  configurarSwipe();

  document.addEventListener("keydown", (event) => {
    const lightbox = document.getElementById("lightbox");
    if (lightbox && lightbox.style.display === "flex") {
      if (event.key === "ArrowRight") mudarFoto(1);
      if (event.key === "ArrowLeft") mudarFoto(-1);
      if (event.key === "Escape") fecharLightbox();
    }
  });

  const modalSobre = document.getElementById("modal-sobre");
  if (modalSobre) {
    modalSobre.addEventListener("click", function (event) {
      if (event.target === this) fecharModalSobre();
    });
  }

  // 4. Inicia as animações (AOS e Contadores)
  if (typeof AOS !== "undefined") {
    AOS.init({ duration: 800, once: true, offset: 100 });
    setTimeout(() => AOS.refresh(), 2000);
  }

  const sessaoEstatisticas = document.querySelector(".estatisticas");
  if (sessaoEstatisticas && typeof IntersectionObserver !== "undefined") {
    let animacaoJaRodou = false;
    const observadorScroll = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting && !animacaoJaRodou) {
          animarContadores();
          animacaoJaRodou = true;
        }
      },
      { threshold: 0.5 },
    );
    observadorScroll.observe(sessaoEstatisticas);
  }
});

// Controlo do botão de Voltar Físico do Telemóvel
window.addEventListener("popstate", () => {
  if (typeof voltarParaAlbuns === "function") voltarParaAlbuns();
  if (typeof fecharLightbox === "function") fecharLightbox();
});
