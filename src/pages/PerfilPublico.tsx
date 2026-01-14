import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { youtubeToEmbed, whatsappToLink } from '@/lib/utils'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface PerfilPublicoData {
  nomeProfissional: string
  especialidade: string
  miniBio: string
  urlFoto: string
  whatsapp: string // Número ou link - convertido para link ao salvar
  urlPerfil: string
  linkVideo: string // URL normal do YouTube - convertida para embed ao salvar
  imagens: string[]
  publicado: boolean
}

const STORAGE_KEY = 'kitfreela_perfil_publico'

const defaultData: PerfilPublicoData = {
  nomeProfissional: '',
  especialidade: '',
  miniBio: '',
  urlFoto: '',
  whatsapp: '',
  urlPerfil: '',
  linkVideo: '',
  imagens: ['', '', '', '', '', ''],
  publicado: false,
}

export default function PerfilPublico() {
  const [data, setData] = useState<PerfilPublicoData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Carrega dados ao montar
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    // Tenta carregar do Supabase se configurado
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: perfilData } = await supabase
            .from('perfis_publicos')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (perfilData) {
            setData({
              nomeProfissional: perfilData.nome_profissional || '',
              especialidade: perfilData.especialidade || '',
              miniBio: perfilData.mini_bio || '',
              urlFoto: perfilData.url_foto || '',
              whatsapp: perfilData.whatsapp || '',
              urlPerfil: perfilData.url_perfil || '',
              linkVideo: perfilData.link_video || '',
              imagens: perfilData.imagens || ['', '', '', '', '', ''],
              publicado: perfilData.publicado || false,
            })
            return
          }
        }
      } catch (error) {
        console.warn('Erro ao carregar do Supabase, usando localStorage:', error)
      }
    }

    // Fallback para localStorage
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setData({ ...defaultData, ...parsed })
      } catch {
        console.warn('Erro ao parsear dados do localStorage')
      }
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    // Converte YouTube URL para embed
    const videoEmbed = data.linkVideo ? youtubeToEmbed(data.linkVideo) : null

    // Converte WhatsApp para link
    const whatsappLink = data.whatsapp ? whatsappToLink(data.whatsapp) : null

    // Valida conversões se os campos foram preenchidos
    if (data.linkVideo && !videoEmbed) {
      setMessage({ type: 'error', text: 'URL do YouTube inválida. Use o formato: youtube.com/watch?v=... ou youtu.be/...' })
      setSaving(false)
      return
    }

    if (data.whatsapp && !whatsappLink) {
      setMessage({ type: 'error', text: 'Número de WhatsApp inválido. Informe o número completo com DDD ou um link válido.' })
      setSaving(false)
      return
    }

    const dataToSave = {
      ...data,
      linkVideo: videoEmbed || '',
      whatsapp: whatsappLink || '',
    }

    // Tenta salvar no Supabase se configurado
    if (isSupabaseConfigured()) {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { error } = await supabase
            .from('perfis_publicos')
            .upsert({
              user_id: user.id,
              nome_profissional: dataToSave.nomeProfissional,
              especialidade: dataToSave.especialidade,
              mini_bio: dataToSave.miniBio,
              url_foto: dataToSave.urlFoto,
              whatsapp: dataToSave.whatsapp,
              url_perfil: dataToSave.urlPerfil,
              link_video: dataToSave.linkVideo,
              imagens: dataToSave.imagens,
              publicado: dataToSave.publicado,
              updated_at: new Date().toISOString(),
            })

          if (error) throw error

          setData(dataToSave)
          setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' })
          setSaving(false)
          return
        }
      } catch (error) {
        console.warn('Erro ao salvar no Supabase, usando localStorage:', error)
      }
    }

    // Fallback para localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
    setData(dataToSave)
    setMessage({ type: 'success', text: 'Perfil salvo localmente!' })
    setSaving(false)
  }

  const updateField = <K extends keyof PerfilPublicoData>(field: K, value: PerfilPublicoData[K]) => {
    setData(prev => ({ ...prev, [field]: value }))
  }

  const updateImagem = (index: number, value: string) => {
    setData(prev => {
      const newImagens = [...prev.imagens]
      newImagens[index] = value
      return { ...prev, imagens: newImagens }
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Perfil Público</h1>
          <p className="text-sm text-gray-500">Sua vitrine profissional online</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${data.publicado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          {data.publicado ? 'Publicado' : 'Rascunho'}
        </span>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`rounded-md p-3 text-sm ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          {/* Identidade */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                Identidade
              </CardTitle>
              <p className="text-xs text-gray-500">Suas informações profissionais</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nomeProfissional">Nome Profissional</Label>
                <Input
                  id="nomeProfissional"
                  placeholder="John Marques"
                  value={data.nomeProfissional}
                  onChange={(e) => updateField('nomeProfissional', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="especialidade">Especialidade</Label>
                <Input
                  id="especialidade"
                  placeholder="Ex: Designer Gráfico, Desenvolvedor Web"
                  value={data.especialidade}
                  onChange={(e) => updateField('especialidade', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="miniBio">Mini Bio</Label>
                <Textarea
                  id="miniBio"
                  placeholder="Uma breve descrição sobre você (máx. 200 caracteres)"
                  rows={3}
                  maxLength={200}
                  value={data.miniBio}
                  onChange={(e) => updateField('miniBio', e.target.value)}
                />
                <p className="text-right text-xs text-gray-500">{data.miniBio.length}/200</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlFoto">URL da Foto</Label>
                <Input
                  id="urlFoto"
                  placeholder="https://..."
                  value={data.urlFoto}
                  onChange={(e) => updateField('urlFoto', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <Input
                  id="whatsapp"
                  placeholder="5511999999999 ou https://wa.me/5511999999999"
                  value={data.whatsapp}
                  onChange={(e) => updateField('whatsapp', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Informe o número com DDD ou cole o link do WhatsApp
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="urlPerfil">URL do Perfil</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">/p/</span>
                  <Input
                    id="urlPerfil"
                    placeholder="seu-nome"
                    className="flex-1"
                    value={data.urlPerfil}
                    onChange={(e) => updateField('urlPerfil', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vídeo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Vídeo
              </CardTitle>
              <p className="text-xs text-gray-500">
                Adicione um vídeo de apresentação (opcional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="linkVideo">Link do vídeo (YouTube)</Label>
                <Input
                  id="linkVideo"
                  placeholder="https://youtube.com/watch?v=... ou https://youtu.be/..."
                  value={data.linkVideo}
                  onChange={(e) => updateField('linkVideo', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Cole a URL normal do YouTube — o sistema converte automaticamente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita */}
        <div className="space-y-6">
          {/* Portfólio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Portfólio
              </CardTitle>
              <p className="text-xs text-gray-500">Até 6 imagens dos seus trabalhos</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div key={index} className="space-y-2">
                  <Label htmlFor={`imagem${index + 1}`}>Imagem {index + 1}</Label>
                  <Input
                    id={`imagem${index + 1}`}
                    placeholder="https://..."
                    value={data.imagens[index] || ''}
                    onChange={(e) => updateImagem(index, e.target.value)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Publicação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                  />
                </svg>
                Publicação
              </CardTitle>
              <p className="text-xs text-gray-500">Controle a visibilidade do seu perfil</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="publicarPerfil"
                  checked={data.publicado}
                  onCheckedChange={(checked) => updateField('publicado', checked === true)}
                />
                <div className="space-y-1">
                  <label
                    htmlFor="publicarPerfil"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Publicar perfil
                  </label>
                  <p className="text-xs text-gray-500">
                    Torna seu perfil acessível através do link e visível na vitrine.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botão Salvar */}
      <div className="flex justify-end">
        <Button size="lg" onClick={handleSave} disabled={saving}>
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>
    </div>
  )
}
