
document.addEventListener('DOMContentLoaded', () => {
    const DB_KEY = 'gestorAppDB_final_v9';
    let db = {
        cidades: [
            { id: 1, nome: 'Recife', iss_aliquota: 5 },
            { id: 2, nome: 'Jaboatão dos Guararapes', iss_aliquota: 5 },
            { id: 3, nome: 'Olinda', iss_aliquota: 5 },
            { id: 4, nome: 'Paulista', iss_aliquota: 5 },
        ],
        prestadores: []
    };
    let prestadorSelecionadoId = null;

    const DOMElements = {
        listaPrestadores: document.getElementById('lista-prestadores'),
        detalhesPrestador: document.getElementById('detalhes-prestador'),
        nomeSelecionado: document.getElementById('nome-selecionado'),
        dataAtual: document.getElementById('data-atual'),
        searchInput: document.getElementById('searchInput'),
        prestadorModal: document.getElementById('prestador-modal'),
        cidadeModal: document.getElementById('cidade-modal'),
        calculadoraModal: document.getElementById('calculadora-modal'),
        prestadorForm: document.getElementById('prestador-form'),
        cidadeForm: document.getElementById('cidade-form'),
        cidadesListaContainer: document.getElementById('cidades-lista-container'),
        calcCidadeSelect: document.getElementById('calc-cidade'),
        resultadoCalculo: document.getElementById('resultado-calculo'),
        prestadorCidadeSelect: document.getElementById('cidadeId'),
        jsonFileInput: document.createElement('input'),
    };
    DOMElements.jsonFileInput.type = 'file';
    DOMElements.jsonFileInput.accept = '.json';
    DOMElements.jsonFileInput.style.display = 'none';
    document.body.appendChild(DOMElements.jsonFileInput);
    
    const salvarDB = () => localStorage.setItem(DB_KEY, JSON.stringify(db));
    const carregarDB = () => {
        const dadosSalvos = localStorage.getItem(DB_KEY);
        if (dadosSalvos) {
            const dadosParseados = JSON.parse(dadosSalvos);
            db.cidades = dadosParseados.cidades || [];
            db.prestadores = dadosParseados.prestadores || [];
        } else {
            salvarDB();
        }
    };

    const abrirModal = (modal) => modal.classList.add('ativo');
    const fecharModal = (modal) => modal.classList.remove('ativo');

    // --- CIDADES ---
    let cidadeEmEdicaoId = null;
    function renderizarCidades() {
        DOMElements.cidadesListaContainer.innerHTML = '';
        const selects = document.querySelectorAll('#calc-cidade, #cidadeId');
        selects.forEach(s => { s.innerHTML = '<option value="">Selecione...</option>'; });

        db.cidades.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(c => {
            const cidadeCard = document.createElement('div');
            cidadeCard.className = 'cidade-card';
            cidadeCard.innerHTML = `<h4>${c.nome}</h4><p><strong>ISS:</strong> ${c.iss_aliquota}%</p><div class="cidade-card-actions"><button class="action-btn edit-btn" onclick="iniciarEdicaoCidade(${c.id})">Editar</button><button class="action-btn delete-btn" onclick="deletarCidade(${c.id})">X</button></div>`;
            DOMElements.cidadesListaContainer.appendChild(cidadeCard);
            selects.forEach(s => s.add(new Option(c.nome, c.id)));
        });
    }
    function resetarFormCidade() {
        cidadeEmEdicaoId = null;
        DOMElements.cidadeForm.reset();
        document.getElementById('cidade-form-titulo').textContent = "Adicionar Nova Cidade";
        DOMElements.cidadeForm.querySelector('button').textContent = "Salvar Cidade";
        document.getElementById('cancelar-edicao-cidade-btn').style.display = 'none';
    }
    window.iniciarEdicaoCidade = (id) => {
        const c = db.cidades.find(c => c.id === id);
        if (!c) return;
        cidadeEmEdicaoId = id;
        document.getElementById('cidade-form-titulo').textContent = "Editar Cidade";
        DOMElements.cidadeForm.querySelector('#cidade-id').value = c.id;
        DOMElements.cidadeForm.querySelector('#cidade-nome').value = c.nome;
        DOMElements.cidadeForm.querySelector('#cidade-iss').value = c.iss_aliquota;
        DOMElements.cidadeForm.querySelector('button').textContent = "Atualizar";
        document.getElementById('cancelar-edicao-cidade-btn').style.display = 'block';
    };
    window.deletarCidade = (id) => {
        if (confirm('Tem certeza?')) {
            db.cidades = db.cidades.filter(c => c.id !== id);
            db.prestadores.forEach(p => { if (p.cidadeId == id) p.cidadeId = ''; });
            salvarDB(); renderizarCidades(); renderizarPrestadores();
        }
    };
    DOMElements.cidadeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const cidadeData = {
            nome: DOMElements.cidadeForm.querySelector('#cidade-nome').value,
            iss_aliquota: parseFloat(DOMElements.cidadeForm.querySelector('#cidade-iss').value),
            inss_aliquota: 11
        };
        if (cidadeEmEdicaoId) {
            const index = db.cidades.findIndex(c => c.id === cidadeEmEdicaoId);
            db.cidades[index] = { ...cidadeData, id: cidadeEmEdicaoId };
        } else {
            cidadeData.id = Date.now();
            db.cidades.push(cidadeData);
        }
        salvarDB(); renderizarCidades(); resetarFormCidade();
    });
    document.getElementById('cancelar-edicao-cidade-btn').addEventListener('click', resetarFormCidade);
    
    // --- PRESTADORES ---
    let prestadorEmEdicaoId = null;
    function renderizarPrestadores(lista = db.prestadores) {
        DOMElements.listaPrestadores.innerHTML = '';
        if (lista.length === 0) { DOMElements.listaPrestadores.innerHTML = '<p style="text-align:center; padding: 10px; color: #888;">Nenhum prestador cadastrado.</p>'; return; }
        lista.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(p => {
            const item = document.createElement('div');
            item.className = 'prestador-item';
            item.onclick = () => selecionarPrestador(p.id);
            if (p.id === prestadorSelecionadoId) item.classList.add('selected');
            const iniciais = p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
            item.innerHTML = `<div class="prestador-avatar" style="background-color: ${gerarCorAleatoria(p.nome)}">${iniciais}</div><div class="prestador-info"><h4>${p.nome}</h4></div>${p.emite_nf_rpa ? `<span class="tag">${p.emite_nf_rpa}</span>` : ''}`;
            DOMElements.listaPrestadores.appendChild(item);
        });
    }
    window.selecionarPrestador = (id) => {
        prestadorSelecionadoId = id;
        const p = db.prestadores.find(pr => pr.id === id);
        if (!p) {
            DOMElements.detalhesPrestador.innerHTML = '<p>Selecione um prestador da lista.</p>';
            DOMElements.nomeSelecionado.textContent = 'Selecione um prestador';
            renderizarPrestadores();
            return;
        };
        DOMElements.nomeSelecionado.textContent = p.nome;
        const cidade = db.cidades.find(c => c.id == p.cidadeId) || {nome: 'N/A'};
        DOMElements.detalhesPrestador.innerHTML = `<div class="detalhes-grid">
            <div class="detalhe-item"><span>CPF/RG</span><strong>${p.cpf || 'N/A'} / ${p.rg || 'N/A'}</strong></div>
            <div class="detalhe-item"><span>Contato</span><strong>${p.celular || 'N/A'} / ${p.email || 'N/A'}</strong></div>
            <div class="detalhe-item"><span>Endereço</span><strong>${p.logradouro || ''}, ${p.numero || 'S/N'} - ${p.bairro || ''}, ${cidade.nome} - ${p.estado || ''}</strong></div>
            <div class="detalhe-item"><span>CEP</span><strong>${p.cep || 'N/A'}</strong></div>
            <div class="detalhe-item"><span>Emissão / Pagamento</span><strong>${p.emite_nf_rpa || 'N/A'} / ${p.tipo_pagamento || 'N/A'}</strong></div>
            <div class="detalhe-item"><span>Banco</span><strong>${p.nome_banco || 'N/A'} (${p.codigo_banco || 'N/A'})</strong></div>
            <div class="detalhe-item"><span>Conta</span><strong>Ag. ${p.agencia_bancaria || 'N/A'} / Conta ${p.conta_bancaria || 'N/A'} (${p.tipo_conta || 'N/A'})</strong></div>
        </div>
        <div class="acoes">
            <button class="btn btn-acao btn-whatsapp" onclick="enviarWhatsapp('${p.celular}', \`${p.nome}\`)">WhatsApp</button>
            <button class="btn btn-acao btn-editar" onclick="abrirModalPrestador(${p.id})">Editar</button>
            <button class="btn btn-acao btn-deletar" onclick="deletarPrestador(${p.id})">Deletar</button>
        </div>`;
        renderizarPrestadores();
    }
    window.deletarPrestador = (id) => {
        if (confirm('Tem certeza?')) {
            db.prestadores = db.prestadores.filter(p => p.id !== id);
            salvarDB();
            prestadorSelecionadoId = null;
            selecionarPrestador(null);
        }
    }
    window.abrirModalPrestador = (id = null) => {
        prestadorEmEdicaoId = id;
        DOMElements.prestadorForm.reset();
        document.getElementById('prestador-modal-titulo').textContent = id ? 'Editar Prestador' : 'Adicionar Prestador';
        // Popula o dropdown de cidades no modal do prestador
        const cidadeSelect = DOMElements.prestadorForm.querySelector('#cidadeId');
        cidadeSelect.innerHTML = '<option value="">Selecione...</option>';
        db.cidades.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(c => cidadeSelect.add(new Option(c.nome, c.id)));

        if (id) {
            const p = db.prestadores.find(pr => pr.id === id);
            DOMElements.prestadorForm.querySelectorAll('[name]').forEach(el => { if(p[el.name]) el.value = p[el.name]; });
        }
        abrirModal(DOMElements.prestadorModal);
    }
    DOMElements.prestadorForm.addEventListener('submit', e => {
        e.preventDefault();
        const formData = new FormData(DOMElements.prestadorForm);
        const prestadorData = Object.fromEntries(formData.entries());
        
        if (prestadorEmEdicaoId) {
            prestadorData.id = prestadorEmEdicaoId;
            const index = db.prestadores.findIndex(p => p.id === prestadorEmEdicaoId);
            db.prestadores[index] = prestadorData;
        } else {
            prestadorData.id = Date.now();
            db.prestadores.push(prestadorData);
        }
        salvarDB(); renderizarPrestadores(); fecharModal(DOMElements.prestadorModal);
        selecionarPrestador(prestadorEmEdicaoId || prestadorData.id);
        prestadorEmEdicaoId = null;
    });

    // --- CALCULADORA ---
    document.getElementById('calcular-btn').addEventListener('click', () => {
        const valorBruto = parseFloat(document.getElementById('calc-valor-bruto').value);
        const cidadeId = Number(document.getElementById('calc-cidade').value);
        if (!valorBruto || !cidadeId) return alert('Preencha todos os campos.');
        const cidade = db.cidades.find(c => c.id === cidadeId);
        if (!cidade) return alert('Cidade não encontrada.');
        
        const INSS_ALIQUOTA = 0.11;
        const IRRF_LIMITE_ISENCAO = 1903.98;
        const tetoINSS = 7786.02;

        const baseINSS = Math.min(valorBruto, tetoINSS);
        const valorINSS = baseINSS * INSS_ALIQUOTA;
        const baseIRRF = valorBruto - valorINSS;
        let valorIRRF = 0;
        
        if (baseIRRF > IRRF_LIMITE_ISENCAO) {
            if (baseIRRF <= 2826.65) valorIRRF = (baseIRRF * 0.075) - 142.80;
            else if (baseIRRF <= 3751.05) valorIRRF = (baseIRRF * 0.15) - 354.80;
            else if (baseIRRF <= 4664.68) valorIRRF = (baseIRRF * 0.225) - 636.13;
            else valorIRRF = (baseIRRF * 0.275) - 869.36;
        }
        valorIRRF = Math.max(0, valorIRRF);
        const valorISS = valorBruto * (cidade.iss_aliquota / 100);
        const valorLiquido = valorBruto - valorINSS - valorIRRF - valorISS;

        DOMElements.resultadoCalculo.innerHTML = `<h3>Resumo do Cálculo</h3><p>Valor Bruto: <span>R$ ${valorBruto.toFixed(2)}</span></p><p>INSS (11%): <span class="desconto">- R$ ${valorINSS.toFixed(2)}</span></p><p>ISS (${cidade.iss_aliquota}%): <span class="desconto">- R$ ${valorISS.toFixed(2)}</span></p><p>IRRF (Tabela Progressiva): <span class="desconto">- R$ ${valorIRRF.toFixed(2)}</span></p><hr><p><strong>Valor Líquido:</strong> <span class="total">R$ ${valorLiquido.toFixed(2)}</span></p>`;
    });
    
    // --- CEP ---
    document.getElementById('cep').addEventListener('input', async (e) => {
        const cep = e.target.value.replace(/\D/g, '');
        if (cep.length === 8) {
            document.getElementById('cep-group').classList.add('loading');
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) { alert('CEP não encontrado.'); } 
                else {
                    DOMElements.prestadorForm.querySelector('#logradouro').value = data.logradouro;
                    DOMElements.prestadorForm.querySelector('#bairro').value = data.bairro;
                    DOMElements.prestadorForm.querySelector('#estado').value = data.uf;
                    const cidadeEncontrada = db.cidades.find(c => c.nome.toLowerCase() === data.localidade.toLowerCase());
                    if (cidadeEncontrada) DOMElements.prestadorForm.querySelector('#cidadeId').value = cidadeEncontrada.id;
                    DOMElements.prestadorForm.querySelector('#numero').focus();
                }
            } catch { alert('Não foi possível buscar o CEP.'); }
             finally { document.getElementById('cep-group').classList.remove('loading'); }
        }
    });
    
    // --- FUNÇÕES EXTRAS ---
    const exportarParaJSON = () => {
        if (db.prestadores.length === 0 && db.cidades.length === 0) return alert('Não há dados para exportar.');
        const dataStr = JSON.stringify(db, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `backup_gestor_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
    };
    const importarDeJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (confirm('Isso irá substituir todos os dados atuais. Deseja continuar?')) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                try {
                    const dataFromFile = JSON.parse(ev.target.result);
                    if (dataFromFile.cidades && dataFromFile.prestadores) {
                        db = dataFromFile;
                        salvarDB(); init();
                        alert('Dados importados com sucesso!');
                    } else { alert('Arquivo de backup inválido.'); }
                } catch { alert('Erro ao ler o arquivo.'); }
            };
            reader.readAsText(file);
        }
        e.target.value = '';
    };
    const gerarRelatorio = () => {
        if (db.prestadores.length === 0) return alert('Nenhum prestador para gerar relatório.');
        let html = `<html><head><title>Relatório de Prestadores</title><style>@media print { .page-break { page-break-after: always; } } body{font-family:sans-serif;margin:20px;} h1,h2{text-align:center;margin-bottom:20px;color:#333} .prestador-card{border:1px solid #ccc;padding:20px;margin-bottom:20px;border-radius:8px;} .prestador-card h3{margin-top:0;border-bottom:2px solid #eee;padding-bottom:10px;margin-bottom:15px;} .grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;} .item p{margin:0;padding:5px 0;border-bottom:1px solid #f0f0f0;} .item strong{color:#555;margin-right:8px;}</style></head><body>`;
        html += `<h1>Relatório de Prestadores</h1><p style="text-align:center;">Gerado em: ${new Date().toLocaleString('pt-BR')}</p>`;
        db.prestadores.forEach(p => {
            const cidade = db.cidades.find(c => c.id == p.cidadeId) || {nome: 'N/A'};
            html += `<div class="prestador-card page-break"><h3>${p.nome}</h3><hr><div class="grid">
                     <div class="item"><h4>Dados Pessoais</h4><p><strong>CPF:</strong>${p.cpf || ''}</p><p><strong>RG:</strong>${p.rg || ''}</p><p><strong>Celular:</strong>${p.celular || ''}</p><p><strong>Email:</strong>${p.email || ''}</p><p><strong>PIS/PASEP:</strong>${p.pis_pasep || ''}</p></div>
                     <div class="item"><h4>Endereço</h4><p><strong>Endereço:</strong>${p.logradouro || ''}, ${p.numero || 'S/N'}</p><p><strong>Bairro:</strong>${p.bairro || ''}</p><p><strong>Cidade:</strong>${cidade.nome} - ${p.estado || ''}</p><p><strong>CEP:</strong>${p.cep || ''}</p></div>
                     <div class="item" style="grid-column: 1 / -1;"><h4>Dados de Pagamento</h4><p><strong>Banco:</strong>${p.nome_banco || ''} (${p.codigo_banco || ''}) | <strong>Agência:</strong>${p.agencia_bancaria || ''} | <strong>Conta:</strong>${p.conta_bancaria || ''} (${p.tipo_conta || ''})</p><p><strong>Emissão:</strong>${p.emite_nf_rpa || ''} | <strong>Forma de Pagamento:</strong>${p.tipo_pagamento || ''}</p></div>
                     </div></div>`;
        });
        html += '</body></html>';
        const newWindow = window.open();
        newWindow.document.write(html);
        newWindow.document.close();
    };
    
    function init() {
        carregarDB(); renderizarCidades(); renderizarPrestadores();
        DOMElements.dataAtual.textContent = new Date().toLocaleDateString('pt-BR', { timeZone: 'America/Recife' });
   }
        window.enviarWhatsapp = (nome, numero) => {
            if (!numero) return alert("Sem celular cadastrado.");
            const mensagem = `Olá, ${numero}! Entro em contato referente aos seus serviços.`;
            const link = `https://wa.me/55${nome.replace(/\D/g, '')}?text=${encodeURIComponent(mensagem)}`;
            window.open(link, '_blank');
        };
    
    document.getElementById('abrir-modal-prestador-btn').addEventListener('click', () => abrirModalPrestador());
    document.getElementById('abrir-modal-cidades-btn').addEventListener('click', () => abrirModal(DOMElements.cidadeModal));
    document.getElementById('abrir-modal-calculadora-btn').addEventListener('click', () => abrirModal(DOMElements.calculadoraModal));
    document.querySelectorAll('.close').forEach(btn => btn.addEventListener('click', (e) => fecharModal(e.target.closest('.modal'))));
    document.getElementById('export-json-btn').addEventListener('click', exportarParaJSON);
    document.getElementById('import-json-btn').addEventListener('click', () => DOMElements.jsonFileInput.click());
    document.getElementById('gerar-relatorio-btn').addEventListener('click', gerarRelatorio);
    DOMElements.jsonFileInput.addEventListener('change', importarDeJSON);
    DOMElements.searchInput.addEventListener('input', () => {
         const termo = DOMElements.searchInput.value.toLowerCase().trim();
         const listaFiltrada = !termo ? db.prestadores : db.prestadores.filter(p => Object.values(p).some(val => String(val).toLowerCase().includes(termo)));
        renderizarPrestadores(listaFiltrada);
    });
    function gerarCorAleatoria(str) { if (!str || str.length === 0) return '#cccccc'; let hash = 0; for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash); let cor = '#'; for (let i = 0; i < 3; i++) cor += ('00' + ((hash >> (i * 8)) & 0xFF).toString(16)).substr(-2); return cor; }

    init();
});
