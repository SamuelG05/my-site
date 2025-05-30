function slugify(text) {
  return text
    .toString()
    .normalize("NFD")                  // Remove acentos
    .replace(/[\u0300-\u036f]/g, "")   // Remove marcas diacríticas
    .toLowerCase()
    .replace(/\s+/g, "-")              // Substitui espaços por hífen
    .replace(/[^\w\-]+/g, "")          // Remove caracteres não-word
    .replace(/\-\-+/g, "-")            // Hífens duplos
    .replace(/^-+/, "")                // Remove hífens no início
    .replace(/-+$/, "");               // Remove hífens no final
}


// ======================
// Animação ao rolar
// ======================
const sections = document.querySelectorAll("section");

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
}, { threshold: 0.1 });

sections.forEach(section => {
  observer.observe(section);
});

// ======================
// ID da planilha
// ======================
const sheetID = '1ZSeUpnbENWA4nIgzdQkVWGzO2iTYHCpOHTfTfxaPDrQ';

// ======================
// Função para carregar dados de uma aba
// ======================
function carregarDados(sheetName, callback) {
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

  fetch(url)
    .then(res => res.text())
    .then(data => {
      const json = JSON.parse(data.substring(47).slice(0, -2));
      const rows = json.table.rows;
      callback(rows);
    })
    .catch(err => {
      console.error(`Erro ao carregar os dados da aba ${sheetName}:`, err);
    });
}

// ======================
// Próximos Jogos (aba: proximos)
// ======================
let jogosProximos = [];

carregarDados('proximos', rows => {
  jogosProximos = rows.map(row => {
    let [dataJogo, hora, timeA, placar, timeB] = row.c.map(c => c?.v || "");

    // Usa a data formatada do Sheets, se disponível
    if (row.c[0]?.f) {
      dataJogo = row.c[0].f;
    } else if (typeof dataJogo === "object" && dataJogo.includes("Date")) {
      const match = dataJogo.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const [, ano, mes, dia] = match.map(Number);
        const diaFormatado = dia.toString().padStart(2, '0');
        const mesFormatado = (mes + 1).toString().padStart(2, '0');
        dataJogo = `${diaFormatado}/${mesFormatado}`;
      }
    }

    return { data: dataJogo, hora, timeA, placar, timeB };
  }).filter(jogo => jogo.timeA && jogo.timeB); // remove linhas vazias

  renderizarLista('tabela-proximos', jogosProximos);

  const botao = document.querySelector('button[data-target="tabela-proximos"]');
  if (jogosProximos.length <= 5 && botao) {
    botao.classList.add('hidden');
  }
});



// ======================
// Resultados (aba: resultados)
// ======================
let jogosResultados = [];

carregarDados('resultados', rows => {
  jogosResultados = rows.map(row => {
    let [dataJogo, hora, timeA, placar, timeB] = row.c.map(c => c?.v || "");

    // Ignora linhas incompletas
    if (!timeA || !timeB || !placar) return null;

    // Usa data formatada se disponível
    if (row.c[0]?.f) {
      dataJogo = row.c[0].f;
    } else if (typeof dataJogo === "object" && dataJogo?.v?.includes("Date")) {
      const match = dataJogo.match(/Date\((\d+),(\d+),(\d+)\)/);
      if (match) {
        const [, ano, mes, dia] = match.map(Number);
        const diaFormatado = dia.toString().padStart(2, '0');
        const mesFormatado = (mes + 1).toString().padStart(2, '0');
        dataJogo = `${diaFormatado}/${mesFormatado}`;
      }
    }

    return { data: dataJogo, hora, timeA, placar, timeB };
  }).filter(Boolean); // Remove nulos

  renderizarLista('tabela-resultados', jogosResultados);

  // Oculta botão se tiver poucos resultados
  const botao = document.querySelector('button[data-target="tabela-resultados"]');
  if (jogosResultados.length <= 3 && botao) {
    botao.classList.add('hidden');
  }
});



// ======================
// Classificação (aba: class)
// ======================
carregarDados('class', rows => {
  const tabela = document.getElementById('tabela-classificacao');
  tabela.innerHTML = "";

  rows.forEach(row => {
    const [posicao, time, pontos, vitorias, derrotas, empates, jogos] = row.c.map(c =>
  (c?.v !== undefined && c?.v !== null) ? c.v : ""
);

    const escudoSlug = slugify(time);
    const imagemFinal = `/escudos/${escudoSlug}.png`;

    const card = document.createElement("div");
    card.className = "card card-classificacao";

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img 
          src="${imagemFinal}" 
          alt="Escudo de ${time}" 
          style="width: 60px; height: 60px; object-fit: contain; border-radius: 10px;"
          onerror="this.onerror=null; this.src='https://via.placeholder.com/32x32?text=?';"
        >
        <div style="font-size: 1rem;">
          <strong>${posicao}º</strong> - ${time} - <strong>${pontos} Ponto(s)</strong> - ${vitorias} Vitória(s) - ${derrotas} Derrota(s) - ${empates} Empate(s) - <strong>${jogos} Jogo(s)</strong>
        </div>
      </div>
    `;

    tabela.appendChild(card);
  });

  const botao = document.querySelector('button[data-target="tabela-classificacao"]');
  if (rows.length <= 4 && botao) {
    botao.classList.add('hidden');
  }
});

// ======================
// Estatísticas (aba: jogadores)
// ======================
carregarDados('jogadores', rows => {
  const tabela = document.getElementById('tabela-estatisticas');
  tabela.innerHTML = "";

  rows.forEach(row => {
    const [jogador, gols, time] = row.c.map(c => c?.v || "");

    const escudo = `/escudos/${slugify(time)}.png`;

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div style="display: flex; align-items: center; gap: 12px;">
        <img 
          src="${escudo}" 
          alt="Escudo ${time}" 
          style="width: 38px; height: 38px; object-fit: contain; border-radius: 4px;"
          onerror="this.onerror=null; this.src='https://via.placeholder.com/28?text=?';"
        >
        <div>
          <strong>${jogador}</strong> - ${gols} gols<br>
          <span style="font-size: 0.85rem; color: #555;">${time}</span>
        </div>
      </div>
    `;

    tabela.appendChild(card);
  });

  // Ocultar botão se tiver 5 ou menos
  const botao = document.querySelector('button[data-target="tabela-estatisticas"]');
  if (rows.length <= 5 && botao) {
    botao.classList.add('hidden');
  }
});


// ======================
// Botões "Mostrar mais"
// ======================

document.querySelectorAll('.botao-toggle').forEach(botao => {
  botao.addEventListener('click', () => {
    const targetId = botao.dataset.target;
    const container = document.getElementById(targetId);

    if (container.classList.contains('expandido')) {
      container.classList.remove('expandido');
      botao.textContent = "Mostrar mais";
    } else {
      container.classList.add('expandido');
      botao.textContent = "Mostrar menos";
    }
  });
});


window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

function renderizarLista(idContainer, jogos) {
  const container = document.getElementById(idContainer);
  container.innerHTML = "";

  jogos.forEach(jogo => {
    const escudoA = `escudos/${slugify(jogo.timeA)}.png`;
    const escudoB = `escudos/${slugify(jogo.timeB)}.png`;

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <img src="${escudoA}" alt="${jogo.timeA}" style="width: 35px; height: 35px; object-fit: contain; border-radius: 4px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/28?text=?';">
          <span style="font-weight: 500;">${jogo.timeA}</span>
        </div>
        <div style="font-weight: bold; font-size: 1rem;">${jogo.placar}</div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="font-weight: 500;">${jogo.timeB}</span>
          <img src="${escudoB}" alt="${jogo.timeB}" style="width: 35px; height: 35px; object-fit: contain; border-radius: 4px;" onerror="this.onerror=null; this.src='https://via.placeholder.com/28?text=?';">
        </div>
      </div>
      <div style="margin-top: 6px; font-size: 0.85rem; color: #666;">
        ${jogo.data} - ${jogo.hora}
      </div>
    `;
    container.appendChild(card);
  });
}

document.getElementById('filtro-global').addEventListener('input', e => {
  const termo = e.target.value.toLowerCase();

  const proximosFiltrados = jogosProximos.filter(j =>
    j.timeA.toLowerCase().includes(termo) || j.timeB.toLowerCase().includes(termo)
  );
  const resultadosFiltrados = jogosResultados.filter(j =>
    j.timeA.toLowerCase().includes(termo) || j.timeB.toLowerCase().includes(termo)
  );

  renderizarLista('tabela-proximos', proximosFiltrados);
  renderizarLista('tabela-resultados', resultadosFiltrados);
});
