/// <reference types="@testing-library/jest-dom" />
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import InstitucionCombobox from './InstitucionCombobox'

// Mock Supabase client
const mockSelect = jest.fn()
const mockInsert = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: () => ({
        ilike: () => ({
          order: () => ({
            order: () => ({
              limit: () => Promise.resolve(mockSelect()),
            }),
          }),
        }),
      }),
      insert: (data: unknown) => ({
        select: () => ({
          single: () => Promise.resolve(mockInsert(table, data)),
        }),
      }),
    }),
    auth: {
      getUser: () => Promise.resolve(mockGetUser()),
    },
  }),
}))

const mockUserInstituciones = [
  { id: 'inst-1', nombre: 'Clínica Las Condes', directorio_id: 'dir-1' },
]

const mockDirectorioResults = [
  {
    id: 'dir-2',
    nombre: 'Clínica Alemana',
    rut: '96.535.760-8',
    ciudad: 'Vitacura',
    region: 'Metropolitana',
    tipo: 'clinica_privada',
    verificada: true,
    created_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'dir-3',
    nombre: 'Hospital Comunitario',
    rut: null,
    ciudad: 'Temuco',
    region: 'Araucanía',
    tipo: 'hospital_publico',
    verificada: false,
    created_at: '2024-01-01T00:00:00Z',
  },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.useFakeTimers()
  mockGetUser.mockReturnValue({ data: { user: { id: 'user-1' } } })
})

afterEach(() => {
  jest.useRealTimers()
})

describe('InstitucionCombobox', () => {
  it('renders the search input', () => {
    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    expect(screen.getByPlaceholderText('Buscar clínica u hospital...')).toBeInTheDocument()
  })

  it('shows selected institution name when value is set', () => {
    render(
      <InstitucionCombobox
        value="inst-1"
        onChange={jest.fn()}
        userInstituciones={mockUserInstituciones}
      />
    )
    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('Clínica Las Condes')
  })

  it('shows prompt text when dropdown opens with empty query', async () => {
    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    await waitFor(() => {
      expect(screen.getByText('Escribe el nombre de la clínica u hospital')).toBeInTheDocument()
    })
  })

  it('searches and displays results after debounce', async () => {
    mockSelect.mockReturnValue({ data: mockDirectorioResults, error: null })

    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    const input = screen.getByRole('textbox')
    fireEvent.focus(input)
    fireEvent.change(input, { target: { value: 'Aleman' } })

    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => {
      expect(screen.getByText('Clínica Alemana')).toBeInTheDocument()
    })
  })

  it('groups results: verified first, then community', async () => {
    mockSelect.mockReturnValue({ data: mockDirectorioResults, error: null })

    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'clinic' } })
    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => {
      expect(screen.getByText('Verificadas')).toBeInTheDocument()
      expect(screen.getByText('Sugeridas por la comunidad')).toBeInTheDocument()
    })
  })

  it('shows "Agregar" option when query has text', async () => {
    mockSelect.mockReturnValue({ data: [], error: null })

    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mi Clínica Nueva' } })
    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => {
      expect(screen.getByText(/Agregar.*Mi Clínica Nueva/)).toBeInTheDocument()
    })
  })

  it('shows the "no ves tu lugar" shortcut when the user has no institutions', () => {
    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    expect(
      screen.getByText('¿No ves tu lugar de trabajo? Agrégalo aquí')
    ).toBeInTheDocument()
  })

  it('hides the shortcut once the user already has institutions', () => {
    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={mockUserInstituciones}
      />
    )
    expect(
      screen.queryByText('¿No ves tu lugar de trabajo? Agrégalo aquí')
    ).not.toBeInTheDocument()
  })

  it('always offers the add-institution escape hatch inside the open dropdown', async () => {
    mockSelect.mockReturnValue({ data: [], error: null })

    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={mockUserInstituciones}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))

    await waitFor(() => {
      expect(
        screen.getByText('¿No ves tu lugar de trabajo? Agrégalo aquí')
      ).toBeInTheDocument()
    })
  })

  it('opens the full form dialog instead of silently inserting when adding a new name', async () => {
    mockSelect.mockReturnValue({ data: [], error: null })

    render(
      <InstitucionCombobox
        value={null}
        onChange={jest.fn()}
        userInstituciones={[]}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Mi Clínica Nueva' } })
    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => screen.getByText(/Agregar.*Mi Clínica Nueva/))
    fireEvent.click(screen.getByText(/Agregar.*Mi Clínica Nueva/))

    // El diálogo se abre con el nombre prellenado; no se inserta nada todavía
    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })
    expect(screen.getByLabelText('Nombre *')).toHaveValue('Mi Clínica Nueva')
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('calls onChange with existing user institution when duplicate directorio_id selected', async () => {
    // The directorio entry has id 'dir-1' (same as directorio_id on user's existing institution)
    const dirEntry = { ...mockDirectorioResults[0], id: 'dir-1', nombre: 'Clínica Las Condes' }
    mockSelect.mockReturnValue({ data: [dirEntry], error: null })
    const handleChange = jest.fn()

    render(
      <InstitucionCombobox
        value={null}
        onChange={handleChange}
        userInstituciones={mockUserInstituciones}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Condes' } })
    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => screen.getByText('Clínica Las Condes'))
    fireEvent.click(screen.getByText('Clínica Las Condes'))

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith(mockUserInstituciones[0])
    })
    // Should NOT insert a new row
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('inserts new institution and calls onChange when new directorio entry selected', async () => {
    mockSelect.mockReturnValue({ data: mockDirectorioResults, error: null })
    mockInsert.mockReturnValue({
      data: { id: 'inst-new', nombre: 'Clínica Alemana', directorio_id: 'dir-2' },
      error: null,
    })
    const handleChange = jest.fn()

    render(
      <InstitucionCombobox
        value={null}
        onChange={handleChange}
        userInstituciones={[]}
      />
    )
    fireEvent.focus(screen.getByRole('textbox'))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Aleman' } })
    act(() => { jest.advanceTimersByTime(350) })

    await waitFor(() => screen.getByText('Clínica Alemana'))
    fireEvent.click(screen.getByText('Clínica Alemana'))

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith({
        id: 'inst-new',
        nombre: 'Clínica Alemana',
        directorio_id: 'dir-2',
      })
    })
  })
})
