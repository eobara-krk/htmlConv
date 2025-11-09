import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  // Zwraca tekst sformatowany pod WhatsApp
  getWhatsappOutput(): string {
    let html = this.getMinimalHtmlOutput();
    // Zamień <b> na **tekst**
    html = html.replace(/<b>(.*?)<\/b>/g, '**$1**');
    // Zamień <i> na _tekst_
    // Specjalna obsługa łamania linii w kursywie
    html = html.replace(/<i>([\s\S]*?)<\/i>/g, (match, p1) => {
      // Podziel kursywę na linie max 80 znaków
      const lines = p1.split(/<br\s*\/?>(\s*)?/);
      return lines.map((line: string) => {
        // Dziel linie na max 80 znaków
        let wrapped: string[] = [];
        for (let i = 0; i < line.length; i += 80) {
          wrapped.push(line.substring(i, i + 80));
        }
        return wrapped.map((l: string) => `_${l}_`).join('\n');
      }).join('\n');
    });
    // Zamień <br> na \n
    html = html.replace(/<br\s*\/?>(\s*)?/gi, '\n');
    // Usuń podwójne \n\n na pojedyncze puste linie
    html = html.replace(/\n{3,}/g, '\n\n');
    // Pozostałe tagi usuń
    html = html.replace(/<[^>]+>/g, '');
    // Zawijaj linie do 80 znaków, ale nie łam w środku _kursywy_
    let result = '';
    html.split(/\n/).forEach(line => {
      // Jeśli linia jest kursywą, nie dziel w środku wyrazu
      if (/^_.*_$/.test(line)) {
        let kursywa = line.slice(1, -1); // bez podkreśleń
        while (kursywa.length > 80) {
          let wrapIdx = kursywa.lastIndexOf(' ', 80);
          if (wrapIdx === -1) wrapIdx = 80;
          result += `_${kursywa.substring(0, wrapIdx)}_\n`;
          kursywa = kursywa.substring(wrapIdx).trimStart();
        }
        result += `_${kursywa}_\n`;
      } else {
        while (line.length > 80) {
          let wrapIdx = line.lastIndexOf(' ', 80);
          if (wrapIdx === -1) wrapIdx = 80;
          result += line.substring(0, wrapIdx) + '\n';
          line = line.substring(wrapIdx).trimStart();
        }
        result += line + '\n';
      }
    });
    return result.trim();
  }
  // Kopiuje minimalny HTML do schowka
  copyMinimalHtmlToClipboard() {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(this.getMinimalHtmlOutput());
    }
  }
  // Zwraca minimalny HTML tylko z <b>, <i>, <br>
  getMinimalHtmlOutput(): string {
  let html = this.simpleHtmlOutput;
  // Zamiana <strong> na <b>tekst</b><br>
  html = html.replace(/<strong>(.*?)<\/strong>/gi, '<b>$1</b><br>');
  // Zamiana <h1>-<h6> na <b>tekst</b><br>
  html = html.replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, '<b>$1</b><br>');
  // <p> zamieniamy na <br> (usuwamy tag, dodajemy <br> na końcu)
  html = html.replace(/<p>/gi, '');
  html = html.replace(/<\/p>/gi, '<br><br>');
  // <i> zostaje bez zmian
  // Usuwamy wszystko poza <b>, <i>, <br>
  html = html.replace(/<(?!b>|\/b|i>|\/i|br\s*\/?)[^>]+>/gi, '');
  // Połącz odnośniki typu (Ps ...) z poprzedzającym tekstem, usuwając ewentualny \n przed nimi
  html = html.replace(/\n+(?=\([A-Za-z]{2,} ?[0-9,\- ]+\))/g, ' ');
  // Zapewnij dokładnie jedną linię przerwy przed każdym <b>
  html = html.replace(/(\s*\n)?\s*<b>/g, '\n<b>');
  html = html.replace(/\n{2,}<b>/g, '\n<b>');
  return html;
  }
  // Kopiuje kod HTML do schowka
  copyHtmlToClipboard() {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(this.simpleHtmlOutput);
    }
  }
  // Zwraca kod prostego HTML do podglądu
  getSimpleHtmlOutput(): string {
    return this.simpleHtmlOutput;
  }
  htmlInput: string = '';
  simpleHtmlOutput: string = '';
  formattedHtmlOutput: string = '';

  // Funkcja konwertująca HTML → Prosty HTML → WhatsApp Markdown
  convertToMarkdown() {
    let text = this.htmlInput;
    // Zamiana cytatów na polskie cudzysłowy
    text = text.replace(/"([^"]+)"/g, '„$1”');
    text = text.replace(/"(?=\s|\.|<br>|<|$)/g, '”');
    text = text.replace(/„([a-zA-ZąćęłńóśźżĄĆĘŁŃÓŚŹŻ0-9 .,!?:;]{1,5})”/g, '"$1"');
    text = text.replace(/"([^"]+)"\./gs, '„$1”.');
    text = text.replace(/"([^"]+)"/gs, '„$1”');
    text = text.replace(/„([^”]+)"/gs, '„$1”');
    text = text.replace(/([„][^”]+)"(?=\s|<|$)/gs, '$1”');
    text = text.replace(/<i>(„[^”]+)"<\/i>/gs, '<i>$1”</i>');

    // Czyszczenie i normalizacja
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
    text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
    text = text.replace(/\u00AD/g, '');
    text = text.replace(/\u2028/g, ' ');
    text = text.replace(/\u2029/g, '\n');
    text = text.replace(/[\u201C\u201D]/g, '"');
    text = text.replace(/[\u2018\u2019]/g, "'");
    text = text.replace(/\u2013/g, '-');
    text = text.replace(/\u2014/g, '--');
    text = text.replace(/\u2026/g, '...');
    text = text.replace(/&nbsp;/g, '\n');
    text = text.replace(/&quot;/g, '"');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    text = text.replace(/&apos;/g, "'");
    text = text.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec));
    text = text.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

    // Usuwanie wszystkich atrybutów z tagów (class, style, href, target, id, etc.)
    text = text.replace(/<(\w+)(\s+[^>]*)?>/g, function(match, tag) {
      // Pozostaw tylko <p>, <div>, <i>, <b>, <u>, <a>, <h1>-<h6>
      if (/^(p|div|i|b|u|a|h[1-6])$/i.test(tag)) {
        return '<' + tag + '>';
      }
      return match;
    });
    // Zamknij tagi bez atrybutów
    text = text.replace(/<(\w+)(\s+[^>]*)?\/>/g, function(match, tag) {
      if (/^(br)$/i.test(tag)) {
        return '<' + tag + '>';
      }
      return match;
    });

    // Prosty HTML: pogrubienie, kursywa, <br>
    let out = text;
    out = out.replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (m, dec) => String.fromCharCode(dec))
      .replace(/&#x([0-9A-Fa-f]+);/g, (m, hex) => String.fromCharCode(parseInt(hex, 16)));
    out = out.replace(/ {2,}/g, ' ');
    out = out.replace(/\n{2,}/g, '\n');
    // Kursywa dla cytatów
    out = out.replace(/„([^”]+)”/g, '<i>„$1”</i>');
    out = out.replace(/'([^']+)'/g, (match, p1) => `<i>'${p1}'</i>`);
    // Pogrubienie z <br> (przed 2 <br>, po 1 <br>) z wyjątkiem 'Amen'
    out = out.replace(/(^|\n)([A-ZĄĆĘŁŃÓŚŹŻ][^\n]{2,40})(?=\n|$)/g, function(match, p1, p2) {
      if (p2.trim().toLowerCase() === 'amen' || p2.trim().toLowerCase() === 'amen!') {
        return '<br><br>' + p2.trim() + '<br>';
      }
      return '<br><br><b>' + p2.trim() + '</b><br>';
    });
    this.simpleHtmlOutput = out.trim();
    this.formattedHtmlOutput = this.simpleHtmlOutput;
  }

  // Funkcja czyszcząca formatowanie HTML
  cleanFormatting(txt: string): string {
    let out = txt.replace(/<[^>]+>/g, '');
    out = out.replace(/&nbsp;/g, ' ')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&apos;/g, "'")
      .replace(/&#(\d+);/g, (m: any, dec: any) => String.fromCharCode(dec))
      .replace(/&#x([0-9A-Fa-f]+);/g, (m: any, hex: any) => String.fromCharCode(parseInt(hex, 16)));
    // Redukuj wielokrotne spacje i entery
    out = out.replace(/ {2,}/g, ' ');
    out = out.replace(/\n{2,}/g, '\n');
    return out.trim();
  }

  // Funkcja zamieniająca tekst na pogrubiony Unicode
  toBoldUnicode(str: string): string {
    const normal = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    const bold   = '𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙𝐚𝐛𝐜𝐝𝐞𝐟𝐠𝐡𝐢𝐣𝐦𝐧𝐨𝐩𝐡𝐫𝐬𝐭𝐮𝐯𝐝𝐱𝐲𝐵';
    return str.split('').map(c => {
      const index = normal.indexOf(c);
      return index >= 0 ? bold[index] : c;
    }).join('');
  }

  // Funkcja podglądu WhatsApp Markdown jako HTML
  renderWhatsAppPreview(text: string): string {
    text = text.replace(/\*\*([^*]+)\*\*/g, '<b><b>$1</b></b>');
    text = text.replace(/\*([^*]+)\*/g, '<b>$1</b>');
    text = text.replace(/_([^_]+)_/g, '<i>$1</i>');
    text = text.replace(/\n/g, '<br>');
    return text;
  }

  wrapHtmlLines(txt: string, maxLen: number = 100): string {
    const lines = txt.split(/<br>/);
    let result: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i].trim();
      line = line.replace(/^([A-Za-zĄĆĘŁŃÓŚŹŻ]{1})\s+([A-Za	zĄĆĘŁŃÓŚŹŻąćęłńóśźż]{2,})/, '$1 $2');
      if (line.length <= maxLen) {
        result.push(line);
      } else {
        // Dla długich linii: podział na wyrazy
        let words = line.split(/ +/);
        let currentLine = '';
        for (let j = 0; j < words.length; j++) {
          let word = words[j];
          if (currentLine.length + word.length + 1 <= maxLen) {
            currentLine += (currentLine.length > 0 ? ' ' : '') + word;
          } else {
            result.push(currentLine);
            currentLine = word;
          }
        }
        if (currentLine.length > 0) {
          result.push(currentLine);
        }
      }
    }
    return result.join('<br>');
  }
}