import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { useLocation } from 'react-router-dom'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const feedbackTypes = [
  { value: 'feedback', label: 'Feedback' },
  { value: 'sugestao', label: 'Sugestao de melhoria' },
  { value: 'reclamacao', label: 'Reclamacao' },
  { value: 'observacao', label: 'Observacao' },
  { value: 'relato', label: 'Relato' },
  { value: 'depoimento', label: 'Depoimento' },
]

export default function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const { user } = useAuth()
  const location = useLocation()

  const [tipo, setTipo] = useState('')
  const [nome, setNome] = useState(user?.user_metadata?.nome || '')
  const [email, setEmail] = useState(user?.email || '')
  const [mensagem, setMensagem] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  function resetForm() {
    setTipo('')
    setNome(user?.user_metadata?.nome || '')
    setEmail(user?.email || '')
    setMensagem('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validacao
    if (!tipo) {
      toast.error('Selecione o tipo de feedback')
      return
    }
    if (!nome.trim()) {
      toast.error('Informe seu nome')
      return
    }
    if (!email.trim()) {
      toast.error('Informe seu email')
      return
    }
    if (!mensagem.trim()) {
      toast.error('Escreva sua mensagem')
      return
    }

    if (!user?.id) {
      toast.error('Voce precisa estar logado para enviar feedback')
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase.from('feedbacks').insert({
        user_id: user.id,
        tipo,
        nome: nome.trim(),
        email: email.trim(),
        mensagem: mensagem.trim(),
        pagina: location.pathname,
      })

      if (error) {
        console.error('Erro ao salvar feedback:', error)
        toast.error('Erro ao enviar feedback. Tente novamente.')
        return
      }

      toast.success('Feedback enviado com sucesso! Obrigado.')
      resetForm()
      onOpenChange(false)
    } catch (err) {
      console.error('Erro ao enviar feedback:', err)
      toast.error('Erro ao enviar feedback. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar Feedback</DialogTitle>
          <DialogDescription>
            Sua opiniao e importante para melhorarmos o kitFreela.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensagem">Mensagem</Label>
            <Textarea
              id="mensagem"
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              placeholder="Escreva sua mensagem..."
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
