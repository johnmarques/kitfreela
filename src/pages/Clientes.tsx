import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

// Mock data - remover quando integrar com backend
const mockClientes = [
  {
    id: 1,
    nome: 'Sabrina de Sousa Rodrigues',
    telefone: '(85) 99999-9999',
    email: 'sabrina@email.com',
    cidade: 'Fortaleza',
    uf: 'CE',
    propostas: 2,
    ultimaInteracao: '07/01/2026',
  },
  {
    id: 2,
    nome: 'João Silva',
    telefone: '(11) 98888-8888',
    email: 'joao.silva@email.com',
    cidade: 'São Paulo',
    uf: 'SP',
    propostas: 1,
    ultimaInteracao: '05/01/2026',
  },
]

export default function Clientes() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Clientes</h1>
        <p className="text-sm text-gray-500">
          Gerencie sua base de clientes vindos das propostas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                />
              </svg>
              <span className="text-sm font-medium text-gray-700">Filtros</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
              {/* Nome */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Nome</label>
                <div className="relative">
                  <svg
                    className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <Input placeholder="Buscar por nome..." className="pl-9" />
                </div>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Telefone</label>
                <Input placeholder="(00) 00000-0000" />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Email</label>
                <Input placeholder="email@exemplo.com" />
              </div>

              {/* Cidade */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">Cidade</label>
                <Input placeholder="Cidade" />
              </div>

              {/* UF */}
              <div className="space-y-2">
                <label className="text-xs text-gray-600">UF</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="AC">AC</SelectItem>
                    <SelectItem value="AL">AL</SelectItem>
                    <SelectItem value="AP">AP</SelectItem>
                    <SelectItem value="AM">AM</SelectItem>
                    <SelectItem value="BA">BA</SelectItem>
                    <SelectItem value="CE">CE</SelectItem>
                    <SelectItem value="DF">DF</SelectItem>
                    <SelectItem value="ES">ES</SelectItem>
                    <SelectItem value="GO">GO</SelectItem>
                    <SelectItem value="MA">MA</SelectItem>
                    <SelectItem value="MT">MT</SelectItem>
                    <SelectItem value="MS">MS</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PA">PA</SelectItem>
                    <SelectItem value="PB">PB</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="PE">PE</SelectItem>
                    <SelectItem value="PI">PI</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="RN">RN</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                    <SelectItem value="RO">RO</SelectItem>
                    <SelectItem value="RR">RR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="SE">SE</SelectItem>
                    <SelectItem value="TO">TO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contador */}
      <p className="text-sm text-gray-500">
        {mockClientes.length} cliente{mockClientes.length !== 1 ? 's' : ''} encontrado
        {mockClientes.length !== 1 ? 's' : ''}
      </p>

      {/* Lista de Clientes */}
      <div className="space-y-3">
        {mockClientes.map((cliente) => (
          <Card key={cliente.id} className="transition-shadow hover:shadow-md">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-lg font-semibold text-primary">
                      {cliente.nome.charAt(0)}
                    </span>
                  </div>

                  {/* Informações */}
                  <div className="space-y-1">
                    <h3 className="font-medium text-gray-900">{cliente.nome}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        {cliente.telefone}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                        {cliente.email}
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {cliente.cidade}, {cliente.uf}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Estatísticas */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-gray-900">{cliente.propostas}</p>
                    <p className="text-xs text-gray-500">
                      Proposta{cliente.propostas !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{cliente.ultimaInteracao}</p>
                    <p className="text-xs text-gray-500">Última interação</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State - mostrar quando não houver clientes */}
      {mockClientes.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <svg
              className="mb-4 h-16 w-16 text-gray-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-medium text-gray-900">Nenhum cliente encontrado</h3>
            <p className="text-sm text-gray-500">
              Os clientes são adicionados automaticamente quando você cria propostas
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
