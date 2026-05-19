import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash, Check, X, Spinner, UserList,
} from '@phosphor-icons/react';
import {
  listResponsaveis, createResponsavel,
  renameResponsavel, deleteResponsavelApi,
} from '../services/api';
import { useToast } from '../context/ToastContext';
import type { Responsavel } from '../types';

// ── Item de responsável (visualização + edição inline) ────────────────

interface ItemProps {
  responsavel: Responsavel;
  onRename:   (id: string, nome: string) => void;
  onDelete:   (id: string) => void;
  busy:       boolean;
}

function ResponsavelItem({ responsavel, onRename, onDelete, busy }: ItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState(responsavel.nome);

  function commitEdit() {
    const trimmed = draft.trim();
    if (!trimmed) { cancelEdit(); return; }
    if (trimmed !== responsavel.nome) onRename(responsavel.id, trimmed);
    setEditing(false);
  }

  function cancelEdit() {
    setDraft(responsavel.nome);
    setEditing(false);
  }

  return (
    <div className="flex items-center gap-2 py-2.5 px-3 rounded-lg
                    bg-gray-50 dark:bg-zinc-800 group">
      <UserList size={16} className="text-gray-400 dark:text-zinc-500 shrink-0" aria-hidden />

      {editing ? (
        <>
          <input
            autoFocus
            className="input py-1 text-sm flex-1"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  commitEdit();
              if (e.key === 'Escape') cancelEdit();
            }}
            maxLength={100}
            aria-label="Editar nome do responsável"
          />
          <button
            className="p-1.5 rounded text-green-600 hover:bg-green-50
                       dark:text-green-400 dark:hover:bg-green-950/30 transition-colors"
            onClick={commitEdit}
            aria-label="Confirmar edição"
          >
            <Check size={15} weight="bold" />
          </button>
          <button
            className="p-1.5 rounded text-gray-400 hover:bg-gray-200
                       dark:hover:bg-zinc-700 transition-colors"
            onClick={cancelEdit}
            aria-label="Cancelar edição"
          >
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <span className="flex-1 text-sm text-gray-800 dark:text-zinc-200 truncate">
            {responsavel.nome}
          </span>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              className="p-1.5 rounded text-gray-400 hover:text-gray-700
                         hover:bg-gray-200 dark:hover:text-zinc-200 dark:hover:bg-zinc-700
                         transition-colors"
              onClick={() => { setDraft(responsavel.nome); setEditing(true); }}
              disabled={busy}
              aria-label={`Renomear ${responsavel.nome}`}
            >
              <Pencil size={14} />
            </button>
            <button
              className="p-1.5 rounded text-gray-400 hover:text-red-600
                         hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-950/30
                         transition-colors"
              onClick={() => onDelete(responsavel.id)}
              disabled={busy}
              aria-label={`Remover ${responsavel.nome}`}
            >
              <Trash size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ── Página principal ─────────────────────────────────────────────────

export default function Settings() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const [newName, setNewName] = useState('');

  const { data: responsaveis = [], isLoading } = useQuery({
    queryKey: ['responsaveis'],
    queryFn:  listResponsaveis,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['responsaveis'] });

  const createMut = useMutation({
    mutationFn: createResponsavel,
    onSuccess: () => { invalidate(); setNewName(''); toast('Responsável adicionado.', 'success'); },
    onError:   (e: Error) => toast(e.message, 'error'),
  });

  const renameMut = useMutation({
    mutationFn: ({ id, nome }: { id: string; nome: string }) => renameResponsavel(id, nome),
    onSuccess: () => { invalidate(); toast('Nome atualizado.', 'success'); },
    onError:   (e: Error) => toast(e.message, 'error'),
  });

  const deleteMut = useMutation({
    mutationFn: deleteResponsavelApi,
    onSuccess: () => { invalidate(); toast('Responsável removido.', 'success'); },
    onError:   (e: Error) => toast(e.message, 'error'),
  });

  const busy = createMut.isPending || renameMut.isPending || deleteMut.isPending;

  function handleAdd() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createMut.mutate(trimmed);
  }

  return (
    <div className="page-container max-w-2xl">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-zinc-100">Configurações</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Gerencie as configurações do sistema.
        </p>
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-gray-800 dark:text-zinc-200 mb-1">
          Responsáveis
        </h2>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mb-5">
          Nomes disponíveis para atribuição nas empresas. Remover um responsável não
          desfaz atribuições já feitas — apenas remove o nome dos seletores.
        </p>

        {/* Lista */}
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-zinc-500 py-4">
            <Spinner size={16} className="animate-spin" /> Carregando…
          </div>
        ) : responsaveis.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-zinc-500 py-4 text-center">
            Nenhum responsável cadastrado ainda.
          </p>
        ) : (
          <div className="space-y-1.5 mb-5">
            {responsaveis.map((r) => (
              <ResponsavelItem
                key={r.id}
                responsavel={r}
                onRename={(id, nome) => renameMut.mutate({ id, nome })}
                onDelete={(id) => deleteMut.mutate(id)}
                busy={busy}
              />
            ))}
          </div>
        )}

        {/* Adicionar novo */}
        <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-zinc-800">
          <input
            type="text"
            className="input flex-1"
            placeholder="Nome do novo responsável…"
            value={newName}
            maxLength={100}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            aria-label="Nome do novo responsável"
          />
          <button
            className="btn-primary shrink-0"
            onClick={handleAdd}
            disabled={!newName.trim() || createMut.isPending}
          >
            {createMut.isPending
              ? <Spinner size={15} className="animate-spin" />
              : <Plus size={15} />
            }
            Adicionar
          </button>
        </div>
      </div>
    </div>
  );
}
