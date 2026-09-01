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
    // "Revisão" -> "Revisão"
    // Pasta fixa: sempre entra na lista (além do modo principal da matéria) e sempre por último.
    revisao: {
      match: /^Revisão$/i,
      label: function (name) {
        return 'Revisão';
      },
      sortKey: function (name) {
        return Infinity; // depois de todas as semanas/aulas
      }
    },
    // "2026-08-06-Aula01" ou "2026-08-06-Aula-01" -> "Aula 01: 06/08"
    // (o hífen antes do número é opcional, pra aceitar as duas formas usadas nas pastas)
    date: {
      match: /^\d{4}-\d{2}-\d{2}-Aula-?\d{2}$/,
      label: function (name) {
        var m = name.match(/^(\d{4})-(\d{2})-(\d{2})-Aula-?(\d{2})$/);
        if (!m) return name;
        return 'Aula ' + m[4] + ': ' + m[3] + '/' + m[2];
      },
      sortKey: function (name) {
        var m = name.match(/^(\d{4})-(\d{2})-(\d{2})-Aula-?(\d{2})$/);
        if (!m) return 0;
        return Number(m[1]) * 10000 + Number(m[2]) * 100 + Number(m[3]); // ordena por ano, mês, dia
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
        // pastas do modo principal da matéria (Semana, Aula, etc.)
        var primary = items
          .filter(function (item) {
            return item.type === 'dir' && mode.match.test(item.name);
          })
          .map(function (item) { return item.name; })
          .sort(function (a, b) { return mode.sortKey(a) - mode.sortKey(b); });

        // pasta "Revisão": sempre incluída junto com o modo principal (se existir na matéria),
        // e sempre por último na lista. Evita duplicar quando o modo escolhido já é 'revisao'.
        var revisao = mode === MODES.revisao ? [] : items
          .filter(function (item) {
            return item.type === 'dir' && MODES.revisao.match.test(item.name);
          })
          .map(function (item) { return item.name; });

        var folders = primary.concat(revisao);

        if (folders.length === 0) return; // mantém os links fixos já existentes no HTML

        container.innerHTML = '';
        folders.forEach(function (folder) {
          var entryMode = MODES.revisao.match.test(folder) ? MODES.revisao : mode;
          var a = document.createElement('a');
          a.className = linkClass;
          a.href = folder + '/index.html';
          a.textContent = entryMode.label(folder);
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