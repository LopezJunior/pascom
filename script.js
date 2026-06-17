// URL da API conectada com o Google Drive da Pascom
const urlApiGoogle =
  "https://script.google.com/macros/s/AKfycby5B-NSrFgTzNvig5MNonX96q2fnW38uuFACjmlY56q5Emvb4I4O_4ZnEBjNlyXDDs/exec";

let dadosDosAlbuns = [];
let fotosDoAlbumAtual = [];
let indiceFotoAtual = 0;

// 1. Função que busca as pastas no Google Drive ao abrir o site
async function iniciarSite() {
  const containerLista = document.getElementById("lista-albuns");

  try {
    const resposta = await fetch(urlApiGoogle);
    dadosDosAlbuns = await resposta.json();

    containerLista.innerHTML = "";

    if (dadosDosAlbuns.length === 0) {
      containerLista.innerHTML =
        '<p style="text-align:center; width:100%;">Nenhuma foto ou pasta encontrada.</p>';
      return;
    }

    // Monta os cards dos álbuns
    dadosDosAlbuns.forEach((album, index) => {
      const idFotoCapa = album.fotos[0].id;
      const urlCapa = `https://drive.google.com/thumbnail?id=${idFotoCapa}&sz=w600`;

      const cardHTML = `
                <div class="card-album">
                    <div class="card-img-wrapper">
                        <span class="badge-fotos"><i class="fa-regular fa-image"></i> ${album.fotos.length}</span>
                        <img src="${urlCapa}" alt="Capa do álbum ${album.titulo}">
                    </div>
                    <div class="card-content">
                        <span class="card-date">ÁLBUM DA COMUNIDADE</span>
                        <h3>${album.titulo}</h3>
                        <button class="link-album btn-abrir" onclick="abrirAlbum(${index})">VER ÁLBUM <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            `;

      containerLista.innerHTML += cardHTML;
    });
  } catch (erro) {
    console.error("Deu erro ao buscar as imagens:", erro);
    containerLista.innerHTML =
      '<p style="text-align:center; width:100%;">Erro ao conectar com o Google Drive da Pascom.</p>';
  }
}

// 2. Função que abre a galeria de fotos de um álbum específico
function abrirAlbum(indexDoAlbum) {
  const albumEscolhido = dadosDosAlbuns[indexDoAlbum];
  fotosDoAlbumAtual = albumEscolhido.fotos;

  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");

  containerLista.style.display = "none";
  containerGaleria.style.display = "grid";
  btnVoltar.style.display = "inline-block";

  tituloSessao.innerText = albumEscolhido.titulo;
  containerGaleria.innerHTML = "";

  albumEscolhido.fotos.forEach((foto, indexFoto) => {
    const urlFoto = `https://drive.google.com/thumbnail?id=${foto.id}&sz=w1000`;
    containerGaleria.innerHTML += `<img src="${urlFoto}" alt="${foto.nome}" loading="lazy" onclick="abrirLightbox(${indexFoto})">`;
  });

  document.getElementById("albuns").scrollIntoView({ behavior: "smooth" });
}

// 3. Função para voltar para a tela inicial de álbuns
function voltarParaAlbuns() {
  const containerLista = document.getElementById("lista-albuns");
  const containerGaleria = document.getElementById("galeria-fotos");
  const btnVoltar = document.getElementById("btn-voltar");
  const tituloSessao = document.getElementById("titulo-sessao");

  containerGaleria.style.display = "none";
  containerLista.style.display = "grid";
  btnVoltar.style.display = "none";

  tituloSessao.innerText = "Momentos que ficaram para sempre";
}

/* ==========================================================================
   FUNÇÕES DO LIGHTBOX (TELA CHEIA COM BOTÃO DE DOWNLOAD)
   ========================================================================== */

function abrirLightbox(index) {
  indiceFotoAtual = index;
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  const btnDownload = document.getElementById("btn-download");

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;

  lightboxImg.src = `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;

  lightbox.style.display = "flex";
}

function fecharLightbox() {
  const lightbox = document.getElementById("lightbox");
  lightbox.style.display = "none";
  document.getElementById("lightbox-img").src = "";
}

function mudarFoto(direcao) {
  indiceFotoAtual += direcao;

  if (indiceFotoAtual >= fotosDoAlbumAtual.length) {
    indiceFotoAtual = 0;
  } else if (indiceFotoAtual < 0) {
    indiceFotoAtual = fotosDoAlbumAtual.length - 1;
  }

  const idFoto = fotosDoAlbumAtual[indiceFotoAtual].id;
  const btnDownload = document.getElementById("btn-download");

  document.getElementById("lightbox-img").src =
    `https://drive.google.com/thumbnail?id=${idFoto}&sz=w1600`;
  btnDownload.href = `https://docs.google.com/uc?export=download&id=${idFoto}`;
}

// Navegação pelo teclado (Setas e Esc)
document.addEventListener("keydown", function (event) {
  const lightbox = document.getElementById("lightbox");
  if (lightbox.style.display === "flex") {
    if (event.key === "ArrowRight") mudarFoto(1);
    if (event.key === "ArrowLeft") mudarFoto(-1);
    if (event.key === "Escape") fecharLightbox();
  }
});

// Dá a partida no site assim que o código carrega
iniciarSite();
