'use strict';

const parseSelector = require('../utils/parse-selector');
const util = require('util');

module.exports = {
    name: 'qualifyingElement',
    nodeTypes: ['rule'],
    message: '%s selectors should not include a qualifying element.',

    inspectParent: function (node) {
        const { parent } = node;
        const result = {
            startsWith: '',
            endsWith: '',
            hasTag: false
        };

        if (!parent || !parent.selectorAst) {
            return result;
        }

        parent.selectorAst.each((selector) => {
            if (!result.startsWith) {
                result.startsWith = selector.first.type;
            }

            result.endsWith = selector.last.type;

            if (!result.hasTag) {
                selector.nodes.forEach((element) => {
                    if (element.type === 'tag') {
                        result.hasTag = true;
                    }
                });
            }
        });

        return result;
    },

    lint: function qualifyingElementLinter (config, node) {
        // Ignore any children of @keyframes. These can contain percentages which are parsed incorrectly as a qualifying element and class selector when containing a comma.
        // For example: "4.9%" is parsed as a selector for a qualifying element "4" and a class selector ".9%"
        if (node.parent && node.parent.type === 'atrule' && node.parent.name === 'keyframes') {
            return;
        }

        const selectors = parseSelector(node);
        const selectorTypes = ['nesting', 'tag'];
        const results = [];

        node.selectorAst = selectors;

        selectors.each((selector) => {
            let result;

            selector.nodes.forEach((element, index) => {
                if (!selectorTypes.includes(element.type)) {
                    return;
                }

                // Fetch the next node to check it
                const next = selector.at(index + 1);

                if (!next) {
                    return;
                }

                const parent = this.inspectParent(node);

                switch (next.type) {
                    case 'attribute':
                        if (config.allowWithAttribute) {
                            return;
                        }

                        result = next;

                        break;
                    case 'class':
                        if (config.allowWithClass || (parent.startsWith === 'class' && !parent.hasTag)) {
                            return;
                        }

                        result = next;

                        break;
                    case 'id':
                        if (config.allowWithId) {
                            return;
                        }

                        result = next;

                        break;
                }

                if (result) {
                    const { column, line } = node.positionBy({
                        word: result.toString().trim()
                    });

                    results.push({
                        column,
                        line,
                        message: util.format(this.message, result.type.charAt(0).toUpperCase() + result.type.substring(1))
                    });
                }
            });
        });

        if (results.length) {
            return results;
        }
    }
};
