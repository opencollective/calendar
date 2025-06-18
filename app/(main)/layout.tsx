import { KeyProvider } from '../contexts/KeyProvider';
import { EventsProvider } from '../contexts/EventsProvider';
import { Header } from '../components/Header';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <KeyProvider>
      <EventsProvider>
        <Header />
        {children}
      </EventsProvider>
    </KeyProvider>
  );
} 