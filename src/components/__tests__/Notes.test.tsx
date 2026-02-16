import { screen, fireEvent } from '@testing-library/react';
import { render } from '../../test/utils';
import Notes from '../Notes';
import { vi } from 'vitest';

// Mock the dependencies if needed, but integration test with context is better.
// For now, let's rely on the default context values provided by customRender.

describe('Notes Component', () => {
    it('renders the notes empty state initially', () => {
        render(<Notes />);

        // Check for main title (h1)
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/Notes|Notizen/i);

        // Check for empty state message
        expect(screen.getByText(/No notes found|Keine Notizen gefunden/i)).toBeInTheDocument();
    });

    it('opens the add note form when clicking new note button', () => {
        render(<Notes />);

        // Button might have text "New Note", "Create Note", "Neue Notiz"
        // There might be two buttons (header and empty state), so we take the first one
        const addButtons = screen.getAllByRole('button', { name: /New Note|Create Note|Notiz|Hinzufügen/i });
        fireEvent.click(addButtons[0]);

        expect(screen.getByPlaceholderText(/Nutrient|Observation|Titel/i)).toBeInTheDocument();
    });
});
