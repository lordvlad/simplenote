// Generated by CoffeeScript 1.6.2
(function() {
  var Node, SimpleNote, interval, obs, revive, time, timeout, uuid,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  timeout = {
    set: function(ms, fn) {
      return setTimeout(fn, ms);
    },
    clear: function(t) {
      return clearTimeout(t);
    }
  };

  interval = {
    set: function(ms, fn) {
      return setInterval(fn, ms);
    },
    clear: function(i) {
      return clearInterval(i);
    }
  };

  revive = function(key, value) {
    var cl;

    if (value["class"] && (cl = window[value["class"]] || revive.constructors[value["class"]]) && typeof cl.fromJSON === "function") {
      return cl.fromJSON(value);
    } else {
      return value;
    }
  };

  obs = function(value, owner) {
    switch (false) {
      case !(value && (value.call || value.read || value.write)):
        return ko.computed(value);
      case !(value && value.map):
        return ko.observableArray(value, owner || this);
      default:
        return ko.observable(value);
    }
  };

  uuid = (function() {
    var id, ids;

    ids = [];
    id = function(a) {
      if (a) {
        return (a ^ Math.random() * 16 >> a / 4).toString(16);
      } else {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, id);
      }
    };
    return function() {
      var e;

      while (true) {
        e = id();
        if (!~ids.indexOf(e)) {
          break;
        }
      }
      ids.push(e);
      return e;
    };
  })();

  time = (function() {
    var a;

    a = obs(0);
    interval.set(1e3, function() {
      return a(new Date);
    });
    return a;
  })();

  /*
  @class SimpleNote
  */


  SimpleNote = (function() {
    function SimpleNote() {
      this.selection = __bind(this.selection, this);
      this.save = __bind(this.save, this);
      var root,
        _this = this;

      this.timeout = null;
      this.interval = null;
      root = null;
      this.nodes = obs([]);
      this.tags = obs([]);
      this.current = obs({
        read: function() {
          return _this.nodes.find("current");
        },
        write: function(id) {
          _this.nodes.find("current").current(false);
          return _this.nodes.find("id", id).current(true);
        }
      });
      this.breadcrumbs = obs(function() {
        return _this.current().parents();
      });
      this.bookmarks = obs(function() {
        if (_this.nodes[1]) {
          return _this.nodes.filter("bookmarked");
        } else {
          return [];
        }
      });
      this.current.extend({
        throttle: 10
      });
      this.breadcrumbs.extend({
        throttle: 10
      });
      this.bookmarks.extend({
        throttle: 10
      });
    }

    SimpleNote.prototype.toJSON = function() {
      return {
        nodes: this.nodes(),
        tags: this.tags()
      };
    };

    SimpleNote.prototype.fromJSON = function(data) {
      var node, nodes, tag, tags;

      nodes = (function() {
        var _i, _len, _ref, _results;

        _ref = data.nodes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          node = _ref[_i];
          _results.push(SimpleNote.Node.fromJSON(node));
        }
        return _results;
      })();
      tags = (function() {
        var _i, _len, _ref, _results;

        _ref = data.tags;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          tag = _ref[_i];
          _results.push(SimpleNote.Tag.fromJSON(tag));
        }
        return _results;
      })();
      this.nodes(nodes);
      this.tags(tags);
      return this;
    };

    SimpleNote.prototype.save = function() {
      timout.clear(this.timeout);
      this.timeout = timeout.set(100, function() {
        return localStorage.notes = JSON.stringify(this.self);
      });
      return this;
    };

    SimpleNote.prototype.create = function() {
      var $doc, error, json,
        _this = this;

      try {
        json = JSON.parse(localStorage.notes, revive);
      } catch (_error) {
        error = _error;
        this.root = SimpleNote.Node({
          smplnt: this,
          parent: obs(null, {
            title: obs("home")
          })
        });
      }
      $doc = $(document);
      $doc.on("click", ".headline", function(e) {
        var $t;

        $t = $(e.target);
        if (!$t.is(".bullet, .action, .ellipsis, .additional")) {
          return $t.parents(".headline").find("title").focus();
        }
      });
      $doc.on("keydown", wre.HotKeyHandler(this.hotkeys, this));
      $doc.on("keyup, click", function() {
        return _this.save();
      });
      this.pop = $("<audio>").attr({
        src: "snd/pop.mp3"
      }).appendTo("body")[0];
      this.startPeriodicalSave();
      return this;
    };

    SimpleNote.prototype.startPeriodicalSave = function() {
      this.interval = interval.set(6e4, this.save);
      return this;
    };

    SimpleNote.prototype.stopPeriodicalSave = function() {
      interval.clear(this.interval);
      return this;
    };

    SimpleNote.prototype.selection = function() {
      var selected,
        _this = this;

      selected = this.selected();
      return {
        remove: function() {
          if (confirm("really delete all selected outlines?")) {
            _this.nodes.removeAll(selected);
            _this.save();
            return _this;
          }
        },
        unselect: function() {
          var node, _i, _len;

          for (_i = 0, _len = selected.length; _i < _len; _i++) {
            node = selected[_i];
            node.selected(false)();
          }
          return _this;
        },
        invert: function() {
          var node, _i, _len;

          for (_i = 0, _len = selected.length; _i < _len; _i++) {
            node = selected[_i];
            node.selected(!node.selected())();
          }
          return _this;
        },
        archive: function() {
          var node, _i, _len, _results;

          _results = [];
          for (_i = 0, _len = selected.length; _i < _len; _i++) {
            node = selected[_i];
            _results.push(node.archived(true)());
          }
          return _results;
        },
        editTags: function() {}
      };
    };

    return SimpleNote;

  })();

  (window || exports).SimpleNote = SimpleNote;

  /*
  * @class Node
  */


  Node = (function() {
    function Node(options) {
      this.editTags = __bind(this.editTags, this);
      var _this = this;

      this.smplnt = options.smplnt;
      this.id = options.id || uuid();
      this.parent = obs((options.parent && options.parent.id) || options.parent);
      if (this.parent() === null) {
        this.smplnt.root = this;
      }
      this.title = obs(options.title || "");
      this.title.extend({
        parse: Node.parseHeadline
      });
      this.note = obs(options.note || "");
      this.note.extend({
        parse: Node.parseNote
      });
      this.deadline = obs(options.deadline != null ? new Date(o.deadline) : false);
      this.bookmarked = obs(options.bookmarked || false);
      this.done = obs(options.done || false);
      this.expanded = obs(options.expanded || false);
      this.listStyleType = obs(options.listStyleType || []);
      this.position = obs(options.position || 0);
      this.activeTitle = obs(false);
      this.activeNote = obs(false);
      this.selected = obs(false);
      this.current = obs(false);
      this.tags = obs([]);
      this.tags.extend({
        pickFrom: {
          array: this.smplnt.tags,
          key: "name"
        }
      });
      this.files = obs([]);
      this.children = obs([]);
      this.hasNote = obs(function() {
        return _this.note().length;
      });
      this.hasChildren = obs(function() {
        return _this.children.length;
      });
      this.cssClass = obs(function() {
        return _this.listStyleType().concat("node").filter(Boolean).join(" ");
      });
      this.bullet = obs(function() {
        return (_this.hasNote() || _this.hasChildren) && (!_this.expanded() && "&#9658;" || _this.expanded() && "&#9660") || "&9679;";
      });
      this.deadlineDisplay = obs(function() {
        var d;

        time();
        d = _this.deadline();
        if (d === !null) {
          if (d > new Date) {
            return moment(d).fromNow();
          } else {
            return _this.alarm();
          }
        } else {
          return "";
        }
      });
    }

    Node.prototype.alarm = function() {
      this.deadline(null);
      this.smplnt.pop.play();
      alert(this.title());
      return "";
    };

    Node.prototype.editTags = function(n, e) {
      return $("#tagsMenu").trigger("position", e.target.on("menuselect", function(e, ui) {
        if (!(ui && ui.item)) {
          return;
        }
        if (!this.tags.remove(ui.item)) {
          return this.tags.push(ui.item);
        }
      }));
    };

    return Node;

  })();

  (window || exports).Node = Node;

}).call(this);
