<user_journey_analysis>

1. Zidentyfikowane ścieżki (PRD US-001…US-004):
   • Rejestracja nowego konta.
   • Logowanie istniejącego użytkownika.
   • Odzyskiwanie zapomnianego hasła (reset 2-etapowy).
   • Wylogowanie z aplikacji.
   • Dostęp do funkcji chronionych (lista przepisów) dla zalogowanych.

2. Główne stany podróży:
   • StanPoczątkowy – użytkownik niezalogowany na stronie startowej.
   • FormularzLogowania – wprowadza dane lub wybiera reset.
   • FormularzRejestracji – tworzy nowe konto.
   • WeryfikacjaDanych – walidacja pól & odpowiedź serwera.
   • PanelPrzepisów – lista/galeria własnych przepisów (chroniona).
   • FormularzResetEmail – podaje e-mail do resetu.
   • OczekiwanieNaMail – informacja o wysłaniu linku.
   • FormularzNoweHaslo – ustawienie nowego hasła.
   • Wylogowywanie – potwierdzenie & czyszczenie sesji.
   • StanKoncowy – zakończenie sesji lub powrót na start.

3. Punkty decyzyjne / alternatywy:
   • if_login_ok – dane logowania poprawne/niepoprawne.
   • if_register_ok – rejestracja powiodła się/błąd.
   • if_reset_token – token poprawny/nie.

4. Cel stanów (skrót):
   • Formularze – zbieranie danych i walidacja client-side.
   • Weryfikacje – komunikacja z API/Supabase.
   • PanelPrzepisów – główna wartość aplikacji.
   • Wylogowywanie – zapewnienie prywatności.
   </user_journey_analysis>

<mermaid_diagram>

```mermaid
stateDiagram-v2
  [*] --> StronaStartowa
  note right of StronaStartowa
    Ekran powitalny lub przekierowanie
    z dowolnego nieautoryzowanego URL
  end note

  StronaStartowa --> FormularzLogowania: Klik "Zaloguj się"
  StronaStartowa --> FormularzRejestracji: Klik "Załóż konto"

  %% LOGOWANIE
  state "Proces Logowania" as Logowanie {
    [*] --> FormularzLogowania
    FormularzLogowania --> WalidacjaLogowania: Przycisk "Zaloguj"
    state if_login_ok <<choice>>
    WalidacjaLogowania --> if_login_ok
    if_login_ok --> PanelPrzepisów: Dane poprawne
    if_login_ok --> FormularzLogowania: Dane błędne
    FormularzLogowania --> FormularzResetEmail: "Zapomniałem hasła"
  }

  %% REJESTRACJA
  state "Proces Rejestracji" as Rejestracja {
    [*] --> FormularzRejestracji
    FormularzRejestracji --> WalidacjaRejestracji: Przycisk "Zarejestruj"
    state if_register_ok <<choice>>
    WalidacjaRejestracji --> if_register_ok
    if_register_ok --> PanelPrzepisów: Sukces
    if_register_ok --> FormularzRejestracji: Błąd
  }

  %% RESET HASŁA
  state "Proces Resetu" as ResetHasla {
    [*] --> FormularzResetEmail
    FormularzResetEmail --> OczekiwanieNaMail: Wyślij email
    OczekiwanieNaMail --> [*]: Link w skrzynce
    OczekiwanieNaMail --> StronaStartowa: "Powrót"
  }

  %% LINK Z MAILA
  FormularzNoweHaslo --> WalidacjaNoweHaslo: Zmień hasło
  state if_reset_token <<choice>>
  WalidacjaNoweHaslo --> if_reset_token
  if_reset_token --> PanelPrzepisów: Token OK
  if_reset_token --> FormularzLogowania: Token błędny / wygasł

  %% PANEL I WYLOGOWANIE
  PanelPrzepisów --> Wylogowywanie: Klik "Wyloguj"
  Wylogowywanie --> StronaStartowa
  StronaStartowa --> [*]
```

</mermaid_diagram>
