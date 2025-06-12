# Dokument wymagań produktu (PRD) - AI RecipeKeeper (MVP)

## 1. Przegląd produktu

AI RecipeKeeper to aplikacja internetowa, zaprojektowana w celu ułatwienia użytkownikom digitalizacji, przechowywania i zarządzania przepisami kulinarnymi. Głównym celem aplikacji jest zautomatyzowanie procesu wprowadzania przepisów z różnych źródeł (notatki tekstowe, popularne strony internetowe z przepisami - głównie aniagotuje.pl i kwestiasmaku.com) poprzez wykorzystanie sztucznej inteligencji (AI) do parsowania i strukturyzacji danych.

Aplikacja jest przeznaczona dla osób, które gromadzą przepisy kulinarne z różnych źródeł i chcą mieć do nich łatwy, zorganizowany dostęp w formie cyfrowej, minimalizując jednocześnie czas poświęcany na ręczne przepisywanie. MVP skupia się na podstawowych funkcjach digitalizacji i zarządzania prywatną kolekcją przepisów. Interfejs użytkownika ma być nowoczesny i minimalistyczny.

## 2. Problem użytkownika

Użytkownicy często borykają się z czasochłonnym i żmudnym procesem ręcznego przepisywania przepisów kulinarnych do formy cyfrowej. Dotyczy to zarówno przepisów z własnych, fizycznych lub cyfrowych notatek, jak i tych znalezionych na ulubionych stronach internetowych (np. aniagotuje.pl, kwestiasmaku.com). Brak efektywnego narzędzia do szybkiej digitalizacji i organizacji utrudnia gromadzenie, przeszukiwanie (poza MVP) i wykorzystywanie posiadanej bazy przepisów. Obecne metody, takie jak ręczne kopiowanie i wklejanie do dokumentów tekstowych czy notatników, są nieefektywne i nie oferują ustrukturyzowanej formy przechowywania danych przepisu (np. osobno składniki, kroki).

Główne typy przepisów, które użytkownicy chcą digitalizować, to:

- Przepisy zapisane w notatkach cyfrowych lub fizycznych.
- Przepisy dostępne online, często zapisywane jako zakładki do stron internetowych.
- Przepisy z książek kucharskich (choć import ze zdjęć/skanów nie jest w MVP).

## 3. Wymagania funkcjonalne

### 3.1. Inteligentne parsowanie przepisów z wklejonego tekstu (AI)

- Użytkownik może wkleić tekst przepisu do dedykowanego pola w aplikacji.
- Obowiązuje limit długości wklejanego tekstu wynoszący 10000 znaków; użytkownik jest informowany o tym limicie w interfejsie.
- System (wykorzystujący model LLM) automatycznie analizuje wklejony tekst i próbuje wyodrębnić następujące informacje:
  - Nazwa potrawy (wymagane).
  - Lista składników: każdy składnik jako pojedynczy, edytowalny ciąg tekstowy (np. "1 szklanka mąki pszennej", "pół kilo marchewki") (wymagane co najmniej jeden).
  - Instrukcje przygotowania: jako lista osobnych, edytowalnych kroków (wymagane co najmniej jeden).
  - Sugerowane tagi: na podstawie treści przepisu, wybierane z predefiniowanej, stałej listy tagów.
  - Czas przygotowania (opcjonalnie).
- Jeśli AI nie jest w stanie zidentyfikować kluczowych sekcji (np. składników lub kroków), użytkownik otrzymuje stosowny komunikat.
- Oryginalny wklejony tekst jest dostępny do wglądu i przywrócenia na etapie weryfikacji, przed finalnym zapisem przepisu. Po zatwierdzeniu zmian przez użytkownika, oryginalny wklejony tekst nie jest przechowywany.

### 3.2. Import przepisu z URL (aniagotuje.pl, kwestiasmaku.com)

- Użytkownik może wkleić link URL do przepisu z predefiniowanych stron: aniagotuje.pl lub kwestiasmaku.com.
- System wykorzystuje dedykowany scraper dla każdej z tych stron do pobrania kluczowych treści przepisu oraz linku do głównego zdjęcia potrawy. Backend następnie pobiera ten obrazek i zapisuje go, udostępniając wewnętrzny URL do niego w ramach danych przepisu.
  - Scraper próbuje przekształcić odpowiedni fragment HTML na format Markdown.
  - Scraper próbuje odfiltrować treści niebędące częścią przepisu (np. reklamy, komentarze) na etapie przetwarzania HTML, jeśli to możliwe.
- Pobrana treść (w formacie Markdown) jest następnie przekazywana do modułu LLM w celu szczegółowej strukturyzacji danych (analogicznie jak przy wklejonym tekście: nazwa, składniki, kroki, tagi, czas przygotowania).
- Pole "Źródło" przepisu jest automatycznie wypełniane adresem URL. Pobranie i zapisanie obrazka odbywa się po stronie serwera.
- W przypadku problemów z działaniem scrapera dla danej strony (np. z powodu zmian w strukturze HTML strony źródłowej wykraczających poza podstawową odporność scrapera), użytkownik otrzymuje stosowny komunikat. Nie zakłada się ciągłego, aktywnego utrzymania scraperów w ramach MVP.

### 3.3. Weryfikacja i edycja sparsowanych/zaimportowanych danych

- Po automatycznym parsowaniu (z tekstu lub URL), użytkownik jest przekierowywany do formularza edycji, gdzie może przejrzeć wyodrębnione dane.
- Formularz umożliwia edycję wszystkich pól przepisu:
  - Nazwa potrawy (pole tekstowe).
  - Składniki (każdy składnik jako osobne, edytowalne pole tekstowe).
  - Kroki przygotowania (każdy krok jako osobne pole tekstowe typu `textarea` z obsługą nowych linii).
  - Tagi (możliwość wyboru wielu tagów z predefiniowanej listy).
  - Czas przygotowania (pole tekstowe).
  - Źródło (pole tekstowe, domyślnie wypełnione dla URL, "Manual" dla ręcznych).
  - Notatki (pole tekstowe typu `textarea` na dodatkowe uwagi użytkownika).
- Użytkownik może dokonać niezbędnych korekt i uzupełnień przed finalnym zapisaniem przepisu.
- Zaimplementowana jest podstawowa walidacja danych formularza (np. obecność nazwy, co najmniej jednego składnika i jednego kroku).
- Możliwość przywrócenia oryginalnego, surowego tekstu wklejonego przez użytkownika (tylko dla opcji wklejania tekstu) na etapie weryfikacji, przed zapisaniem. Użytkownik może wyświetlić i edytować ten oryginalny tekst. Dostępna jest również opcja ponownego przetworzenia zmodyfikowanego oryginalnego tekstu, po uprzednim wyświetleniu ostrzeżenia o nadpisaniu zmian w bieżącym formularzu przepisu.

### 3.4. Manualne dodawanie, przeglądanie, edycja i usuwanie przepisów (CRUD)

- Użytkownik może manualnie dodać nowy przepis poprzez wypełnienie pustego formularza (analogicznego do formularza edycji). Dla ręcznie dodawanych przepisów, pole "Źródło" jest domyślnie ustawiane na "Manual".
- Użytkownik może przeglądać listę wszystkich swoich zapisanych przepisów.
- Użytkownik może otworzyć dowolny przepis z listy, aby wyświetlić jego pełne szczegóły.
- Użytkownik może edytować każdy istniejący przepis w swojej bazie.
- Użytkownik może usunąć dowolny przepis ze swojej bazy.
- Data dodania/wprowadzenia przepisu jest automatycznie zapisywana i wyświetlana na stronie szczegółów przepisu.

### 3.5. Prosty system kont użytkowników (auth)

- Rejestracja: Użytkownik może założyć nowe konto podając adres e-mail lub nazwę użytkownika oraz hasło. Użyjemy gotowego narzędzia do autentykacji - Supabase Auth. Potwierdzenie adresu e-mail nie jest wymagane w MVP.
- Aby korzystać z aplikacji, użytkownik musi być zalogowany.
- Logowanie: Zarejestrowany użytkownik może zalogować się do systemu przy użyciu swoich danych uwierzytelniających.
- Zapomniałem hasła: Użytkownik ma możliwość zresetowania zapomnianego hasła.
- Wszystkie przepisy dodane przez użytkownika są w 100% prywatne i dostępne tylko dla niego po zalogowaniu. Nie ma funkcji udostępniania przepisów innym użytkownikom w MVP.

### 3.6. Przeglądanie listy własnych przepisów

- Po zalogowaniu użytkownik widzi listę/galerię swoich przepisów.
- Każdy element listy zawiera co najmniej:
  - Miniaturę zdjęcia potrawy (jeśli zostało zaimportowane z URL lub dodane manualnie) - w przypadku gdy nie ma zdjęcia, wyświetla się domyślne zdjęcie.
  - Nazwę potrawy.
- Możliwość sortowania listy przepisów według daty dodania (domyślnie od najnowszych) oraz nazwy.
- Możliwość filtrowania listy przepisów poprzez wybór jednego lub wielu tagów jednocześnie.
- W widocznym miejscu na liście przepisów znajduje się licznik wszystkich przepisów użytkownika.
- Kliknięcie na przepis na liście przenosi do widoku szczegółowego przepisu, który wyświetla wszystkie dane przepisu, w tym większe zdjęcie (jeśli dostępne) i datę dodania.

### 3.7. Feedback użytkownika dotyczący jakości parsowania

- Po zakończeniu procesu parsowania AI (zarówno z wklejonego tekstu, jak i z importu URL, przed etapem edycji), użytkownik ma możliwość oceny jakości wyniku za pomocą prostego mechanizmu (np. "kciuk w górę" / "kciuk w dół"). Użytkownik może zmienić swoją wcześniejszą ocenę.
- Zebrany feedback może być wykorzystany do przyszłej analizy i ulepszania modelu AI, ale nie jest to aktywna funkcja w MVP.

## 4. Granice produktu (Co NIE wchodzi w zakres MVP)

Następujące funkcjonalności NIE są częścią tej wersji produktu (MVP):

- Zaawansowane generowanie planów dietetycznych z uwzględnieniem makroskładników, kalorii, alergii.
- Dobieranie przepisów na podstawie posiadanych produktów w "wirtualnej lodówce".
- Uniwersalny scraper/parser URL działający dla dowolnych stron kulinarnych innych niż aniagotuje.pl i kwestiasmaku.com.
- Generowanie list zakupów.
- Zaawansowane funkcje społecznościowe (np. udostępnianie przepisów, komentowanie, ocenianie przepisów innych użytkowników).
- Automatyczne skalowanie ilości składników w przepisach na inną liczbę porcji.
- Analiza wartości odżywczych przepisów.
- Generowanie obrazów do przepisów przez AI.
- Dedykowane aplikacje mobilne (iOS, Android).
- Import przepisów ze zdjęć lub skanów dokumentów.
- Aktywne, ciągłe utrzymanie scraperów dla dedykowanych stron (aniagotuje.pl, kwestiasmaku.pl) wykraczające poza podstawową implementację i odporność na drobne zmiany.
- Zaawansowane wyszukiwanie przepisów (np. po składnikach, części nazwy) oraz filtrowanie po tagach na liście przepisów.
- Normalizacja jednostek miar w składnikach (np. przeliczanie "szklanka" na "ml").
- Możliwość zmiany kolejności składników lub kroków metodą "przeciągnij i upuść" (drag&drop) w formularzu edycji (możliwe tylko poprzez manualne kopiowanie i wklejanie).
- Możliwość dodawania własnych, niestandardowych tagów (tylko wybór z predefiniowanej listy).

## 5. Historyjki użytkowników

### Zarządzanie kontem użytkownika

ID: US-001
Tytuł: Rejestracja nowego użytkownika

Opis: Jako nowy użytkownik, chcę móc zarejestrować konto używając adresu email/nazwy użytkownika i hasła, abym mógł przechowywać swoje przepisy prywatnie.
Kryteria akceptacji:

1. Użytkownik może przejść do formularza rejestracji ze strony logowania.
2. Formularz rejestracji wymaga podania unikalnego adresu email lub nazwy użytkownika oraz hasła.
3. Hasło musi być wpisane dwukrotnie w celu potwierdzenia jego poprawności.
4. System validuje format adresu email (jeśli email jest używany jako identyfikator).
5. System sprawdza, czy podany adres email/nazwa użytkownika nie jest już zarejestrowany w systemie.
6. Po pomyślnym wypełnieniu i przesłaniu formularza, konto użytkownika jest tworzone.
7. Użytkownik jest informowany o pomyślnej rejestracji i zostaje automatycznie zalogowany i przekierowany na stronę główną.
8. W przypadku błędów (np. zajęty email/nazwa użytkownika, niepasujące hasła, niepoprawny format email), użytkownik widzi czytelne komunikaty błędów przy odpowiednich polach formularza.

ID: US-002
Tytuł: Logowanie do systemu

Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji używając mojego adresu email/nazwy użytkownika i hasła, abym miał dostęp do moich zapisanych przepisów.
Kryteria akceptacji:

1. Użytkownik może przejść do formularza logowania ze strony głównej (przekierowanie z głównej strony).
2. Formularz logowania wymaga podania adresu email/nazwy użytkownika oraz hasła.
3. Po pomyślnym uwierzytelnieniu, użytkownik jest przekierowywany do panelu głównego (listy swoich przepisów).
4. W przypadku podania niepoprawnych danych logowania, użytkownik widzi stosowny komunikat błędu.
5. System zapewnia podstawowe zabezpieczenia przed atakami typu brute-force (np. limit prób logowania - poza MVP, ale warto wspomnieć o standardach bezpieczeństwa).

ID: US-003
Tytuł: Wylogowanie z systemu

Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zabezpieczyć dostęp do mojego konta na współdzielonym urządzeniu.
Kryteria akceptacji:

1. Zalogowany użytkownik ma dostęp do opcji "Wyloguj".
2. Po kliknięciu "Wyloguj", sesja użytkownika jest kończona.
3. Użytkownik jest przekierowywany na stronę główną lub stronę logowania.
4. Użytkownik nie ma już dostępu do swoich prywatnych danych bez ponownego zalogowania.

ID: US-004
Tytuł: Odzyskiwanie zapomnianego hasła

Opis: Jako zarejestrowany użytkownik, który zapomniał hasła, chcę móc zainicjować proces resetowania hasła, abym mógł odzyskać dostęp do swojego konta.
Kryteria akceptacji:

1. Na stronie logowania dostępny jest link "Zapomniałem hasła".
2. Po kliknięciu linku, użytkownik jest proszony o podanie swojego adresu email powiązanego z kontem.
3. Jeśli email istnieje w systemie, na ten adres wysyłana jest wiadomość z linkiem lub kodem do zresetowania hasła.
4. Użytkownik, klikając w link lub wprowadzając kod, może ustawić nowe hasło dla swojego konta.
5. Nowe hasło musi spełniać minimalne wymagania bezpieczeństwa (jeśli zdefiniowano).
6. Użytkownik jest informowany o pomyślnej zmianie hasła.

### Dodawanie przepisu

ID: US-005
Tytuł: Dodawanie przepisu poprzez wklejenie tekstu

Opis: Jako użytkownik, chcę móc wkleić skopiowany tekst przepisu, aby system AI automatycznie wyodrębnił jego strukturę (nazwę, składniki, kroki, tagi, czas przygotowania).
Kryteria akceptacji:

1. Użytkownik ma dostęp do opcji "Dodaj przepis z tekstu".
2. Wyświetla się pole tekstowe, do którego użytkownik może wkleić tekst przepisu (limit 10000 znaków, informacja o limicie jest widoczna).
3. Po wklejeniu tekstu i zainicjowaniu parsowania, system AI próbuje wyodrębnić: nazwę potrawy, listę składników (jako osobne stringi), listę kroków (jako osobne stringi), umożliwić wybór wielu tagów (z predefiniowanej listy) oraz czas przygotowania.
4. Wyniki parsowania są prezentowane użytkownikowi w edytowalnym formularzu w celu weryfikacji i edycji.
5. Źródło przepisu jest ustawiane na "Własny" lub podobne, wskazujące na wklejony tekst.

ID: US-006
Tytuł: Obsługa nieudanego parsowania AI dla wklejonego tekstu

Opis: Jako użytkownik, chcę być poinformowany, jeśli AI nie jest w stanie zidentyfikować kluczowych elementów przepisu (np. składników lub kroków) z wklejonego tekstu, abym mógł wprowadzić dane manualnie.
Kryteria akceptacji:

1. Jeśli AI nie zidentyfikuje np. żadnych składników lub kroków, użytkownik widzi odpowiedni komunikat.
2. Użytkownik jest nadal przekierowywany do formularza edycji, gdzie pola mogą być puste lub częściowo wypełnione, z możliwością manualnego uzupełnienia.

ID: US-007
Tytuł: Dodawanie przepisu poprzez import z URL (aniagotuje.pl, kwestiasmaku.com)

Opis: Jako użytkownik, chcę móc wkleić link URL do przepisu ze strony aniagotuje.pl lub kwestiasmaku.com, aby system automatycznie pobrał treść, zapisał na serwerze główne zdjęcie i wyodrębnił strukturę przepisu za pomocą scrapera i AI.
Kryteria akceptacji:

1. Użytkownik ma dostęp do opcji "Importuj przepis z URL".
2. Wyświetla się pole do wklejenia linku URL.
3. Po wklejeniu linku z obsługiwanej domeny i zainicjowaniu importu:
   a. Dedykowany scraper pobiera treść HTML przepisu i link do głównego zdjęcia. Backend następnie pobiera obrazek i zapisuje go na serwerze.
   b. Treść HTML jest konwertowana do formatu Markdown i oczyszczana z nieistotnych elementów (np. reklamy, komentarze), jeśli to możliwe.
   c. Oczyszczona treść jest przekazywana do modułu LLM, który parsuje ją na: nazwę potrawy, listę składników, listę kroków, umożliwia wybór wielu tagów, czas przygotowania.
4. Wyniki parsowania oraz pobrany i zapisany na serwerze obrazek są prezentowane użytkownikowi w edytowalnym formularzu w celu weryfikacji i edycji.
5. Pole "Źródło" jest automatycznie wypełniane wklejonym adresem URL.

ID: US-008
Tytuł: Obsługa błędów importu z URL

Opis: Jako użytkownik, chcę być informowany o problemach podczas importu przepisu z URL, takich jak nieobsługiwana strona, niepoprawny link lub błąd scrapera/AI.
Kryteria akceptacji:

1. Jeśli użytkownik wklei URL z nieobsługiwanej domeny, system wyświetla komunikat informujący o tym, że tylko aniagotuje.pl i kwestiasmaku.com są wspierane.
2. Jeśli wklejony URL jest niepoprawny (np. błąd 404, zły format), system wyświetla odpowiedni komunikat błędu.
3. Jeśli scraper napotka problem z pobraniem lub przetworzeniem treści z obsługiwanej strony (np. z powodu znaczących zmian w strukturze strony), użytkownik widzi komunikat o błędzie importu.
4. W przypadku błędu importu, użytkownik może zostać zachęcony do spróbowania metody wklejenia tekstu.

ID: US-009
Tytuł: Weryfikacja i edycja sparsowanych/zaimportowanych danych przepisu

Opis: Jako użytkownik, chcę móc przejrzeć dane wyodrębnione przez AI/scraper i dokonać niezbędnych korekt oraz uzupełnień w edytowalnym formularzu przed finalnym zapisem przepisu.
Kryteria akceptacji:

1. Po automatycznym parsowaniu (z tekstu lub URL), wyświetlany jest formularz z wypełnionymi polami: nazwa, składniki (każdy jako osobne pole tekstowe), kroki (każdy jako osobne pole `textarea`), tagi (możliwość wyboru wielu tagów z predefiniowanej listy), czas przygotowania, źródło, notatki.
2. Użytkownik może edytować każde z tych pól.
3. Użytkownik może dodawać nowe składniki/kroki lub usuwać istniejące.
4. Dla przepisów dodawanych z wklejonego tekstu, użytkownik ma możliwość wyświetlenia i edycji oryginalnego, surowego tekstu wklejonego na początku. Możliwe jest również ponowne przetworzenie tego zmodyfikowanego tekstu, po otrzymaniu ostrzeżenia o nadpisaniu zmian w formularzu.
5. Formularz zawiera przycisk "Zapisz przepis".
6. Podstawowa walidacja formularza przed zapisem (np. nazwa, min. 1 składnik, min. 1 krok).

ID: US-010
Tytuł: Manualne dodawanie nowego przepisu

Opis: Jako użytkownik, chcę móc dodać przepis całkowicie ręcznie, wypełniając wszystkie niezbędne pola w formularzu, jeśli nie chcę korzystać z AI lub importu.
Kryteria akceptacji:

1. Użytkownik ma dostęp do opcji "Dodaj przepis ręcznie".
2. Wyświetlany jest pusty formularz analogiczny do formularza edycji (nazwa, składniki, kroki, tagi, czas przygotowania, źródło).
3. Pole "Źródło" jest domyślnie ustawione na "Manual" lub podobne i jest edytowalne.
4. Użytkownik wypełnia pola przepisu.
5. Po wypełnieniu i kliknięciu "Zapisz przepis", nowy przepis jest dodawany do bazy użytkownika.
6. Obowiązuje ta sama walidacja co przy edycji (np. nazwa, min. 1 składnik, min. 1 krok).
7. Data dodania przepisu jest automatycznie zapisywana.

ID: US-011
Tytuł: Przekroczenie limitu znaków przy wklejaniu tekstu

Opis: Jako użytkownik, chcę być poinformowany, jeśli wklejany tekst przepisu przekracza dozwolony limit znaków (10000), abym mógł go skrócić.
Kryteria akceptacji:

1. Interfejs użytkownika informuje o maksymalnym limicie znaków dla wklejanego tekstu (10000 znaków).
2. Jeśli użytkownik wklei tekst przekraczający limit, system wyświetli komunikat błędu, uniemożliwiając dalsze przetwarzanie.
3. Użytkownik musi skrócić tekst, aby kontynuować.

### Zarządzanie Przepisami

ID: US-012
Tytuł: Przeglądanie listy własnych przepisów

Opis: Jako zalogowany użytkownik, chcę widzieć listę wszystkich moich zapisanych przepisów, aby móc szybko je zlokalizować i wybrać interesujący mnie przepis.
Kryteria akceptacji:

1. Po zalogowaniu, użytkownik jest przekierowywany do widoku listy swoich przepisów lub ma do niego łatwy dostęp.
2. Lista wyświetla przepisy w formie kafelków lub wierszy.
3. Każdy element na liście pokazuje co najmniej miniaturę zdjęcia (jeśli dostępne) oraz tytuł przepisu.
4. Lista jest domyślnie sortowana po dacie dodania, od najnowszego do najstarszego. Możliwe jest również sortowanie po nazwie.
5. Użytkownik ma możliwość filtrowania listy przepisów poprzez wybór wielu tagów jednocześnie.
6. W widocznym miejscu na stronie listy przepisów znajduje się licznik pokazujący całkowitą liczbę przepisów użytkownika.

ID: US-013
Tytuł: Wyświetlanie szczegółów przepisu

Opis: Jako użytkownik, chcę móc otworzyć przepis z listy, aby zobaczyć wszystkie jego szczegóły, w tym pełną listę składników, instrukcje, zdjęcie, źródło i datę dodania.
Kryteria akceptacji:

1. Kliknięcie na przepis na liście przepisów przenosi użytkownika do widoku szczegółowego tego przepisu.
2. Widok szczegółowy wyświetla wszystkie zapisane informacje o przepisie:
   a. Nazwa potrawy.
   b. Większe zdjęcie potrawy (jeśli dostępne).
   c. Lista składników.
   d. Kroki przygotowania.
   e. Tagi.
   f. Czas przygotowania.
   g. Źródło.
   h. Data dodania/wprowadzenia przepisu.
3. W widoku szczegółowym dostępne są opcje edycji i usunięcia przepisu.

ID: US-014
Tytuł: Edycja istniejącego przepisu

Opis: Jako użytkownik, chcę móc edytować każdy zapisany przeze mnie przepis, aby poprawić błędy, zaktualizować informacje lub dodać notatki.
Kryteria akceptacji:

1. Z poziomu widoku szczegółów przepisu lub bezpośrednio z listy (np. ikona edycji), użytkownik może przejść do trybu edycji przepisu.
2. Wyświetlany jest formularz edycji, wstępnie wypełniony aktualnymi danymi przepisu (analogiczny do US-009).
3. Użytkownik może modyfikować wszystkie pola przepisu.
4. Po dokonaniu zmian i zapisaniu, przepis w bazie danych jest aktualizowany.
5. Użytkownik jest przekierowywany z powrotem do widoku szczegółów zaktualizowanego przepisu lub na listę przepisów.
6. Obowiązuje walidacja formularza.

ID: US-015
Tytuł: Usuwanie przepisu

Opis: Jako użytkownik, chcę móc usunąć przepis ze swojej kolekcji, jeśli już go nie potrzebuję.
Kryteria akceptacji:

1. Z poziomu widoku szczegółów przepisu lub bezpośrednio z listy (np. ikona usuwania), użytkownik może zainicjować usunięcie przepisu.
2. System prosi o potwierdzenie usunięcia przepisu, aby zapobiec przypadkowemu działaniu.
3. Po potwierdzeniu, przepis jest trwale usuwany z bazy danych użytkownika.
4. Użytkownik jest informowany o pomyślnym usunięciu i przekierowywany na listę przepisów.
5. Licznik przepisów jest aktualizowany.

### Inne

ID: US-016
Tytuł: Zbieranie opinii na temat jakości parsowania AI

Opis: Jako użytkownik, chcę mieć możliwość szybkiego ocenienia jakości parsowania AI po dodaniu przepisu, aby pomóc w ulepszaniu tej funkcji.
Kryteria akceptacji:

1. Po zakończeniu parsowania AI (z tekstu lub URL), a przed lub w trakcie etapu weryfikacji/edycji, użytkownikowi prezentowana jest prosta opcja oceny (np. ikony "kciuk w górę" / "kciuk w dół").
2. Wybór użytkownika jest rejestrowany przez system (bez natychmiastowej widocznej reakcji dla użytkownika poza np. zmianą stanu ikony).
3. Udzielenie opinii jest opcjonalne.

ID: US-017
Tytuł: Prywatność przepisów użytkownika

Opis: Jako użytkownik, chcę mieć pewność, że moje przepisy są prywatne i dostępne tylko dla mnie po zalogowaniu.
Kryteria akceptacji:

1. Dostęp do listy przepisów i ich szczegółów wymaga zalogowania.
2. Przepisy jednego użytkownika nie są widoczne dla innych użytkowników systemu.
3. W MVP nie ma żadnych funkcji udostępniania przepisów.

## 6. Metryki sukcesu

Sukces MVP aplikacji AI RecipeKeeper będzie mierzony na podstawie następujących kryteriów:

1.  Poprawność parsowania AI dla przepisów wklejanych jako tekst:

    - Metryka: Minimum 70% pól przepisu (nazwa potrawy, większość stringów składników, większość kroków przygotowania, ewentualne tagi) jest poprawnie identyfikowanych przez system AI dla typowych, dobrze sformatowanych przepisów tekstowych, wymagając jedynie drobnych korekt od użytkownika. "Dobrze sformatowany przepis" oznacza taki, gdzie sekcje (składniki, kroki) są wizualnie oddzielone i wewnętrznie spójne. "Poprawne przypisanie" oznacza, że elementy listy składników są rozpoznawane jako składniki, a kroki instrukcji jako kroki.
    - Sposób pomiaru: Testowanie na predefiniowanym zestawie co najmniej 20-30 zróżnicowanych, dobrze sformatowanych przepisów tekstowych. Analiza manualna wyników parsowania vs. dane referencyjne. Opcjonalnie, analiza zagregowanych danych z feedbacku użytkowników (kciuki góra/dół - US-016).

2.  Poprawność importu i parsowania przepisów z URL (aniagotuje.pl, kwestiasmaku.com):

    - Metryka: Dla ponad 80% prób importu z podanych URL (aniagotuje.pl, kwestiasmaku.com), system (dedykowany scraper + AI) jest w stanie poprawnie wyodrębnić i ustrukturyzować kluczowe dane przepisu (nazwa potrawy, większość stringów składników, większość kroków przygotowania, ewentualne tagi, główne zdjęcie), wymagając co najwyżej drobnych korekt od użytkownika.
    - Sposób pomiaru: Testowanie na predefiniowanym zestawie co najmniej 20-30 linków do przepisów z aniagotuje.pl i kwestiasmaku.com (różne kategorie i struktury). Analiza manualna wyników importu i parsowania vs. dane referencyjne. Opcjonalnie, analiza zagregowanych danych z feedbacku użytkowników.

3.  Podstawowa użyteczność i retencja (zdolność do wykonania kluczowych zadań):

    - Metryka: Użytkownik jest w stanie pomyślnie dodać (korzystając z co najmniej dwóch różnych metod: wklejenie tekstu, import URL, dodanie manualne), zapisać, odnaleźć na liście i wyświetlić szczegóły co najmniej 10 swoich przepisów.
    - Sposób pomiaru: Testy użyteczności przeprowadzone na małej grupie testowej (np. znajomi, docelowi użytkownicy). Obserwacja i ankiety dotyczące łatwości wykonania zadań.

4.  Stabilność systemu autoryzacji:
    - Metryka: Użytkownicy mogą bezproblemowo zakładać konta, logować się, resetować hasła. Błędy związane z autoryzacją występują rzadziej niż w 1% prób.
    - Sposób pomiaru: Monitoring logów systemowych, testy manualne kluczowych ścieżek autoryzacji.
