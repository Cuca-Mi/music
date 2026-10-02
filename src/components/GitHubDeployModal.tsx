import React, { useState } from 'react';
import { X, Check, Copy, Download, Upload, CheckCircle2 } from 'lucide-react';
import { Playlist, Track } from '../data/musicCatalog';

interface GitHubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  playlists: Playlist[];
  onImportBackup: (data: { tracks?: Track[]; playlists?: Playlist[] }) => void;
}

export const GitHubDeployModal: React.FC<GitHubDeployModalProps> = ({
  isOpen,
  onClose,
  tracks,
  playlists,
  onImportBackup,
}) => {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const [importStatus, setImportStatus] = useState('');

  if (!isOpen) return null;

  const gitCommands = `git init
git add .
git commit -m "Deploy OndaTube Music para GitHub Pages"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(gitCommands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const handleExportJson = () => {
    const payload = JSON.stringify({ tracks, playlists, exportedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ondatube-catalogo.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        onImportBackup(parsed);
        setImportStatus('Catálogo importado com sucesso!');
        setTimeout(() => setImportStatus(''), 3000);
      } catch {
        setImportStatus('Arquivo JSON inválido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl rounded-xl bg-[#141418] border border-white/10 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h2 className="font-display text-lg font-bold text-white">
              Pronto para Rodar no GitHub Pages
            </h2>
            <p className="text-xs text-neutral-400">
              Arquitetura 100% compatível com hospedagem estática no GitHub
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            aria-label="Fechar janela"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-5 space-y-5 text-sm">
          {/* Pre-configured Checklist */}
          <div className="p-4 rounded-lg bg-[#0A0A0C] border border-white/10 space-y-2.5">
            <div className="text-xs font-semibold text-white">
              O que já está configurado neste projeto para o GitHub entender:
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Correção Anti-Tela Branca (Bundle Pré-Compilado Incluso):</strong> o repositório agora inclui o código JavaScript e CSS já compilados em <code className="font-mono">/assets</code> e <code className="font-mono">/docs</code>. Mesmo que o GitHub Pages esteja no modo padrão (<em>Deploy from a branch: main / root</em>), o site carrega imediatamente sem ficar com tela branca!
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Caminhos Relativos (<code className="font-mono">base: './'</code>)</strong> no <code className="font-mono">vite.config.ts</code> para funcionar em qualquer subpasta <code className="font-mono">seu-usuario.github.io/nome-do-repo</code> sem quebrar imagens ou scripts.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Workflow Automático (<code className="font-mono">.github/workflows/deploy.yml</code>)</strong> incluído: basta enviar o código para o GitHub e ativar <em>Settings → Pages → Source: GitHub Actions</em>.
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs text-neutral-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Áudio Nativo WebAudio + MP3 + YouTube Embed:</strong> funciona direto no navegador sem exigir banco de dados externo ou servidor pago.
              </span>
            </div>
          </div>

          {/* Terminal commands */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-neutral-200">
                1. Comandos para subir no seu repositório GitHub:
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-white/10 hover:bg-white/15 text-white transition-colors whitespace-nowrap"
              >
                {copiedCmd ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar comandos</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 rounded-lg bg-[#0A0A0C] border border-white/10 font-mono text-xs text-neutral-300 overflow-x-auto leading-relaxed">
              {gitCommands}
            </pre>
          </div>

          {/* Backup & Export JSON */}
          <div className="pt-2 border-t border-white/10">
            <span className="block text-xs font-semibold text-neutral-200 mb-2">
              2. Exportar ou Importar seu Catálogo de Músicas e Playlists (JSON):
            </span>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#FF0033] hover:bg-[#D9002B] rounded-lg transition-colors whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Baixar Catálogo (.json)</span>
              </button>

              <label className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-neutral-200 bg-white/10 hover:bg-white/15 rounded-lg cursor-pointer transition-colors whitespace-nowrap">
                <Upload className="w-3.5 h-3.5" />
                <span>Importar Catálogo (.json)</span>
                <input
                  type="file"
                  accept="application/json"
                  onChange={handleImportJson}
                  className="hidden"
                />
              </label>

              {importStatus && (
                <span className="text-xs text-emerald-400 font-medium">{importStatus}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
