/*!
 * TinyMCE
 *
 * Copyright (c) 2023 Ephox Corporation DBA Tiny Technologies, Inc.
 * Licensed under the Tiny commercial license. See https://www.tiny.cloud/legal/
 *
 * Version: 5.10.9
 */
(function () {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    function Plugin () {
      global.add('contextmenu', function () {
      });
    }

    Plugin();

}());
