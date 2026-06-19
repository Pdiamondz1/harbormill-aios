import { useState } from "react";
import { useNotes, useAddNote } from "@/hooks/useNotes";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

// Light internal notes attached to a project (projectId) or general (null).
export function NotesThread({ projectId }: { projectId: string | null }) {
  const { data: notes = [], isLoading } = useNotes(projectId);
  const addNote = useAddNote(projectId);
  const [body, setBody] = useState("");

  const submit = () => {
    const value = body.trim();
    if (!value || addNote.isPending) return;
    addNote.mutate(value, { onSuccess: () => setBody("") });
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        <div className="flex justify-center py-6">
          <Spinner className="h-6 w-6" />
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-2">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-border bg-card px-3 py-2">
              <p className="whitespace-pre-wrap text-sm text-foreground">{note.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(note.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2 rounded-xl border border-border bg-card p-2">
        <textarea
          rows={1}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Add a note…"
          className="max-h-32 flex-1 resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        <Button size="sm" onClick={submit} isLoading={addNote.isPending} disabled={!body.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
