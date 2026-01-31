import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { youtubeToEmbed, whatsappToLink } from '@/lib/utils'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useFreelancerContext } from '@/contexts/FreelancerContext'

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
  const { freelancerId, isLoading: freelancerLoading } = useFreelancerContext()
  const [data, setData] = useState<PerfilPublicoData>(defaultData)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Carrega dados quando freelancerId estiver disponivel
  useEffect(() => {
    if (!freelancerLoading && freelancerId) {
      loadData()
    }
  }, [freelancerId, freelancerLoading])

  const loadData = async () => {
    // Tenta carregar do Supabase se configurado e freelancerId disponivel
    if (isSupabaseConfigured() && freelancerId) {
      try {
        const { data: perfilData, error } = await supabase
          .from('perfis_publicos')
          .select('*')
          .eq('freelancer_id', freelancerId)
          .single()

        if (error && error.code !== 'PGRST116') {
          console.error('Erro ao carregar perfil publico:', error)
        }

        if (perfilData) {
          // Converte array de imagens do banco (pode ser null ou array incompleto)
          const imagens = Array.isArray(perfilData.imagens)
            ? [...perfilData.imagens, '', '', '', '', '', ''].slice(0, 6)
            : ['', '', '', '', '', '']

          setData({
            nomeProfissional: perfilData.nome_profissional || '',
            especialidade: perfilData.especialidade || '',
            miniBio: perfilData.mini_bio || '',
            urlFoto: perfilData.url_foto || '',
            whatsapp: perfilData.whatsapp || '',
            urlPerfil: perfilData.url_perfil || '',
            linkVideo: perfilData.link_video || '',
            imagens,
            publicado: perfilData.publicado || false,
          })
          return
        }
      } catch (error) {
        console.warn('Erro ao carregar do Supabase:', error)
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

    // Verifica se o usuario esta identificado
    if (!freelancerId) {
      setMessage({ type: 'error', text: 'Erro: Usuario nao identificado.' })
      setSaving(false)
      return
    }

    // Tenta salvar no Supabase
    if (isSupabaseConfigured()) {
      try {
        // Filtra imagens vazias mas mantém array para salvar
        const imagensParaSalvar = dataToSave.imagens.filter((img: string) => img.trim() !== '')

        // Sanitiza o slug do perfil
        const slugSanitizado = dataToSave.urlPerfil.toLowerCase().replace(/[^a-z0-9-]/g, '')

        const { error } = await supabase
          .from('perfis_publicos')
          .upsert({
            freelancer_id: freelancerId,
            nome_profissional: dataToSave.nomeProfissional,
            especialidade: dataToSave.especialidade,
            mini_bio: dataToSave.miniBio,
            url_foto: dataToSave.urlFoto,
            whatsapp: dataToSave.whatsapp,
            url_perfil: slugSanitizado,
            link_video: dataToSave.linkVideo,
            imagens: imagensParaSalvar,
            publicado: dataToSave.publicado,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: 'freelancer_id',
          })

        if (error) {
          console.error('Erro detalhado:', error)
          // Verifica se é erro de slug duplicado
          if (error.code === '23505' && error.message.includes('url_perfil')) {
            setMessage({ type: 'error', text: 'Esta URL de perfil ja esta em uso. Escolha outra.' })
            setSaving(false)
            return
          }
          throw error
        }

        // Atualiza o estado local com o slug sanitizado
        setData({ ...dataToSave, urlPerfil: slugSanitizado })
        setMessage({ type: 'success', text: 'Perfil salvo com sucesso!' })
        setSaving(false)
        return
      } catch (error) {
        console.error('Erro ao salvar no Supabase:', error)
        setMessage({ type: 'error', text: 'Erro ao salvar perfil. Tente novamente.' })
        setSaving(false)
        return
      }
    }

    setMessage({ type: 'error', text: 'Erro: Banco de dados nao configurado.' })
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
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="page-header">
          <h1 className="page-title">Perfil Público</h1>
          <p className="page-subtitle">Sua vitrine profissional online</p>
        </div>
        <span className={`status-badge w-fit ${data.publicado ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
          <span className={`status-dot ${data.publicado ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          {data.publicado ? 'Publicado' : 'Rascunho'}
        </span>
      </div>

      {/* Mensagem de feedback */}
      {message && (
        <div className={`rounded-lg p-4 text-sm flex items-center gap-3 animate-fade-in ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
          <div className={`rounded-full p-1 ${message.type === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
            {message.type === 'success' ? (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </div>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Coluna Esquerda */}
        <div className="space-y-6">
          {/* Identidade */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-blue-100 p-2">
                  <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                Identidade
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Suas informacoes profissionais</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Foto de Perfil - Primeiro campo */}
              <div className="space-y-2">
                <Label htmlFor="urlFoto">Foto de Perfil</Label>
                <Input
                  id="urlFoto"
                  placeholder="https://..."
                  value={data.urlFoto}
                  onChange={(e) => updateField('urlFoto', e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  Cole o link de uma imagem (ex: Google Drive, Imgur, etc.)
                </p>
                {/* Preview da foto de perfil */}
                {data.urlFoto && (
                  <div className="mt-3 flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-100 flex-shrink-0">
                      <img
                        src={data.urlFoto}
                        alt="Preview da foto de perfil"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                        onLoad={(e) => {
                          (e.target as HTMLImageElement).style.display = 'block'
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500">
                      Preview da sua foto de perfil
                    </p>
                  </div>
                )}
              </div>

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

          {/* Video */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-red-100 p-2">
                  <svg className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                Video
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">
                Adicione um video de apresentacao (opcional)
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
          {/* Portfolio */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-purple-100 p-2">
                  <svg className="h-4 w-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                Portfolio
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Ate 6 imagens dos seus trabalhos</p>
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

          {/* Publicacao */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2.5 text-base font-semibold text-gray-900">
                <div className="rounded-lg bg-green-100 p-2">
                  <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                </div>
                Publicacao
              </CardTitle>
              <p className="text-xs text-gray-500 mt-1">Controle a visibilidade do seu perfil</p>
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

              {/* Link do perfil público */}
              {data.publicado && data.urlPerfil && (
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Seu perfil está acessível em:</p>
                  <a
                    href={`/p/${data.urlPerfil.toLowerCase().replace(/[^a-z0-9-]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    /p/{data.urlPerfil.toLowerCase().replace(/[^a-z0-9-]/g, '')}
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Botao Salvar */}
      <div className="flex justify-end pt-2">
        <Button size="lg" onClick={handleSave} disabled={saving} className="btn-primary gap-2 min-w-[180px]">
          {saving ? (
            <>
              <span className="loading-spinner w-4 h-4 border-white/30 border-t-white"></span>
              Salvando...
            </>
          ) : (
            <>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Salvar Alteracoes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
