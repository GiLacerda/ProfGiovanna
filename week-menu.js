/**
 * Busca automaticamente as pastas de conteúdo dentro de uma matéria (FrontEnd, Mobile, PWIII...)
 * usando a API pública do GitHub, e monta os botões de navegação.
 *
 * Uso — pastas "SemanaXX" (FrontEnd, Mobile):
 *   <div class="links">
 *     <a class="week" href="Semana18/index.html">Semana 18</a>  <!-- fica como fallback -->
 *   </div>
 *   <script src="../week-menu.js"></script>
 *   <script>renderWeekMenu('FrontEnd', '.links');</script>
 *
 * Uso — pastas por data "DD-MM" (PWIII):
 *   <div class="links">
 *     <a class="date" href="13-08/index.html">13/08</a>  <!-- fica como fallback -->
 *   </div>
 *   <script src="../week-menu.js"></script>
 *   <script>renderWeekMenu('PWIII', '.links', { mode: 'date', linkClass: 'date' });</script>
 *
 * Se a API do GitHub não responder (limite de requisições, sem internet etc.), o script
 * simplesmente não mexe em nada e os links fixos que já estão no HTML continuam funcionando.
 */
(function () {
  var OWNER = 'GiLacerda';
  var REPO = 'ProfGiovanna';

  var MODES = {
    // "Semana18" -> "Semana 18" | "Semana15-16-17" -> "Semanas 15, 16 e 17"
    semana: {
      match: /^Semana/i,
      label: function (name) {
        var nums = name.match(/\d+/g);
        if (!nums) return name;
        if (nums.length === 1) return 'Semana ' + nums[0];
        var last = nums[nums.length - 1];
        var rest = nums.slice(0, -1);
        return 'Semanas ' + rest.join(', ') + ' e ' + last;
      },
      sortKey: function (name) {
        var nums = name.match(/\d+/g);
        return nums ? parseInt(nums[0], 10) : 0;
      }
    },
    // "13-08" (dia-mês) -> "13/08"
    date: {
      match: /^\d{4}-\d{2}-\d{2}-Aula\d{2}$/,
      label: function (name) {
        var parts = name.split('-'); // [ano, mes, dia, "AulaNN"]
        var aula = parts[3].replace('Aula', ''); // "01"
        return 'Aula ' + aula + ': ' + parts[2] + '/' + parts[1];
      },
      sortKey: function (name) {
        var parts = name.split('-'); // [ano, mes, dia, "AulaNN"]
        return Number(parts[0]) * 10000 + Number(parts[1]) * 100 + Number(parts[2]); // ordena por ano, mês, dia
      }
    }
  };

  window.renderWeekMenu = function (subject, containerSelector, options) {
    options = options || {};
    var mode = MODES[options.mode || 'semana'];
    var linkClass = options.linkClass || 'week';
    var container = document.querySelector(containerSelector);
    if (!container || !mode) return;

    fetch('https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + subject)
      .then(function (res) {
        if (!res.ok) throw new Error('GitHub API respondeu ' + res.status);
        return res.json();
      })
      .then(function (items) {
        var folders = items
          .filter(function (item) {
            return item.type === 'dir' && mode.match.test(item.name);
          })
          .map(function (item) { return item.name; })
          .sort(function (a, b) { return mode.sortKey(a) - mode.sortKey(b); });

        if (folders.length === 0) return; // mantém os links fixos já existentes no HTML

        container.innerHTML = '';
        folders.forEach(function (folder) {
          var a = document.createElement('a');
          a.className = linkClass;
          a.href = folder + '/index.html';
          a.textContent = mode.label(folder);
          container.appendChild(a);
        });
      })
      .catch(function (err) {
        // Sem internet, API fora do ar, ou limite de requisições atingido:
        // não faz nada e deixa os links fixos que já estavam no HTML.
        console.warn('week-menu.js: não foi possível buscar as pastas automaticamente, mantendo lista fixa.', err);
      });
  };
})();
