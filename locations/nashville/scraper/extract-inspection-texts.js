const HIGH_SCORES_EMPTY_TEXT = 'There are no high scores available for the date range you selected.';
const LOW_SCORES_EMPTY_TEXT = 'There are no low scores available for the date range you selected.';

const highScoresSelector = $ => $('b:contains("High Scores:")')
  .nextUntil(':contains("Low Scores")', 'p');
const lowScoresSelector = $ => $(':contains("Low Scores:")')
  .nextUntil(':contains("Updates")', 'p');

function getTexts(dom, selector, emptyText) {
  const allTexts = selector(dom)
    .map((_, element) => dom(element).text())
    .get();

  const onlyEmptyText =
    allTexts.length === 1 &&
    allTexts[0] === emptyText;

  return onlyEmptyText
    ? []
    : allTexts;
}

module.exports = (cheerio) =>
  function extractInspectionTexts(html) {
    const dom = cheerio.load(html);

    return [
      ...getTexts(dom, highScoresSelector, HIGH_SCORES_EMPTY_TEXT),
      ...getTexts(dom, lowScoresSelector, LOW_SCORES_EMPTY_TEXT)
    ];
  }
