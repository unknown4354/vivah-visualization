export interface EditHistoryEntry {
  id: string
  imageUrl: string
  prompt: string
  enhancedPrompt?: string
  timestamp: Date
  parentId: string | null
  iterationGroup?: string
  isChosen: boolean
  model: string
}

export interface EditSession {
  id: string
  projectId: string
  originalImageUrl: string
  currentImageUrl: string
  currentEntryId: string | null
  history: EditHistoryEntry[]
  accumulatedContext: string[] // ["added roses", "changed lighting to golden"]
}

export class EditSessionStore {
  private sessions: Map<string, EditSession> = new Map()

  /**
   * Create a new editing session
   */
  createSession(projectId: string, originalImageUrl: string): EditSession {
    const session: EditSession = {
      id: crypto.randomUUID(),
      projectId,
      originalImageUrl,
      currentImageUrl: originalImageUrl,
      currentEntryId: null,
      history: [],
      accumulatedContext: []
    }
    this.sessions.set(session.id, session)
    return session
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): EditSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Add entries to history (supports multiple iterations)
   */
  addToHistory(
    sessionId: string,
    entries: Array<{
      imageUrl: string
      prompt: string
      enhancedPrompt?: string
      model: string
    }>,
    iterationGroup?: string
  ): EditHistoryEntry[] {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const newEntries: EditHistoryEntry[] = entries.map((entry, index) => ({
      id: crypto.randomUUID(),
      imageUrl: entry.imageUrl,
      prompt: entry.prompt,
      enhancedPrompt: entry.enhancedPrompt,
      timestamp: new Date(),
      parentId: session.currentEntryId,
      iterationGroup: iterationGroup || crypto.randomUUID(),
      isChosen: index === 0, // First one is chosen by default
      model: entry.model
    }))

    session.history.push(...newEntries)
    return newEntries
  }

  /**
   * Mark an entry as chosen (and unmark others in same iteration group)
   */
  chooseEntry(sessionId: string, entryId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const entry = session.history.find(e => e.id === entryId)
    if (!entry) throw new Error('Entry not found')

    // Unmark other entries in same iteration group
    if (entry.iterationGroup) {
      session.history
        .filter(e => e.iterationGroup === entry.iterationGroup)
        .forEach(e => e.isChosen = false)
    }

    // Mark this one as chosen
    entry.isChosen = true
    session.currentImageUrl = entry.imageUrl
    session.currentEntryId = entry.id

    // Update accumulated context
    this.updateAccumulatedContext(session, entry.prompt)
  }

  /**
   * Update accumulated context based on prompt
   */
  private updateAccumulatedContext(session: EditSession, prompt: string): void {
    // Extract key actions from prompt
    const actions = this.extractActions(prompt)
    if (actions) {
      session.accumulatedContext.push(actions)
      // Keep only last 5 for conciseness
      if (session.accumulatedContext.length > 5) {
        session.accumulatedContext = session.accumulatedContext.slice(-5)
      }
    }
  }

  /**
   * Extract key action from prompt for context
   */
  private extractActions(prompt: string): string {
    const lowerPrompt = prompt.toLowerCase()

    // Common action patterns
    if (lowerPrompt.includes('add')) {
      const match = prompt.match(/add(?:ed|ing)?\s+(.+?)(?:\s+to|,|$)/i)
      return match ? `added ${match[1]}` : 'added elements'
    }
    if (lowerPrompt.includes('change') || lowerPrompt.includes('replace')) {
      const match = prompt.match(/(?:change|replace)(?:d|ing)?\s+(.+?)(?:\s+to|with|,|$)/i)
      return match ? `changed ${match[1]}` : 'changed elements'
    }
    if (lowerPrompt.includes('remove')) {
      const match = prompt.match(/remove(?:d|ing)?\s+(.+?)(?:,|$)/i)
      return match ? `removed ${match[1]}` : 'removed elements'
    }
    if (lowerPrompt.includes('lighting') || lowerPrompt.includes('light')) {
      return 'adjusted lighting'
    }
    if (lowerPrompt.includes('color')) {
      return 'adjusted colors'
    }

    // Default: use first few words
    return prompt.split(' ').slice(0, 4).join(' ')
  }

  /**
   * Go back to a specific entry in history
   */
  goBackTo(sessionId: string, entryId: string): EditSession {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const entryIndex = session.history.findIndex(e => e.id === entryId)
    if (entryIndex === -1) throw new Error('Entry not found')

    const entry = session.history[entryIndex]

    // Update current state
    session.currentImageUrl = entry.imageUrl
    session.currentEntryId = entry.id

    // Rebuild accumulated context up to this point
    session.accumulatedContext = []
    for (let i = 0; i <= entryIndex; i++) {
      if (session.history[i].isChosen) {
        this.updateAccumulatedContext(session, session.history[i].prompt)
      }
    }

    return session
  }

  /**
   * Branch from a specific entry (creates new edit path)
   */
  branchFrom(sessionId: string, entryId: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) throw new Error('Session not found')

    const entry = session.history.find(e => e.id === entryId)
    if (!entry) throw new Error('Entry not found')

    // Set as current entry for branching
    session.currentImageUrl = entry.imageUrl
    session.currentEntryId = entry.id

    return entryId
  }

  /**
   * Get history tree structure for visualization
   */
  getHistoryTree(sessionId: string): EditHistoryEntry[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    return session.history
  }

  /**
   * Get only chosen entries (main edit path)
   */
  getChosenPath(sessionId: string): EditHistoryEntry[] {
    const session = this.sessions.get(sessionId)
    if (!session) return []

    return session.history.filter(e => e.isChosen)
  }

  /**
   * Build context-aware prompt for next edit
   */
  buildContextualPrompt(sessionId: string, newPrompt: string): string {
    const session = this.sessions.get(sessionId)
    if (!session || session.accumulatedContext.length === 0) {
      return newPrompt
    }

    const context = session.accumulatedContext.join(', ')
    return `Building on previous edits (${context}), ${newPrompt}`
  }

  /**
   * Get accumulated context
   */
  getAccumulatedContext(sessionId: string): string[] {
    const session = this.sessions.get(sessionId)
    return session?.accumulatedContext || []
  }

  /**
   * Clear session
   */
  clearSession(sessionId: string): void {
    this.sessions.delete(sessionId)
  }

  /**
   * Export session for persistence
   */
  exportSession(sessionId: string): EditSession | null {
    const session = this.sessions.get(sessionId)
    return session ? { ...session } : null
  }

  /**
   * Import session from persistence
   */
  importSession(session: EditSession): void {
    this.sessions.set(session.id, session)
  }
}

export const editSessionStore = new EditSessionStore()
