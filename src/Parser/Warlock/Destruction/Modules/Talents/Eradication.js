import React from 'react';

import Analyzer from 'Parser/Core/Analyzer';
import Combatants from 'Parser/Core/Modules/Combatants';
import Enemies from 'Parser/Core/Modules/Enemies';

import SPELLS from 'common/SPELLS';
import ITEMS from 'common/ITEMS';
import SpellLink from 'common/SpellLink';
import StatisticBox, { STATISTIC_ORDER } from 'Main/StatisticBox';
import SpellIcon from 'common/SpellIcon';
import { formatNumber, formatPercentage } from 'common/format';

import getDamageBonus from '../WarlockCore/getDamageBonus';

const ERADICATION_DAMAGE_BONUS = 0.15;

// only calculates the bonus damage, output depends if we have the talent directly or via legendary finger (then it appears as either a Statistic or Item)
class Eradication extends Analyzer {
  static dependencies = {
    enemies: Enemies,
    combatants: Combatants,
  };

  bonusDmg = 0;

  on_initialized() {
    this.active = this.combatants.selected.hasTalent(SPELLS.ERADICATION_TALENT.id) || this.combatants.selected.hasFinger(ITEMS.SOUL_OF_THE_NETHERLORD.id);
  }

  suggestions(when) {
    const uptime = this.enemies.getBuffUptime(SPELLS.ERADICATION_DEBUFF.id) / this.owner.fightDuration;
    when(uptime).isLessThan(0.7)
      .addSuggestion((suggest, actual, recommended) => {
        return suggest(<span>Your uptime on the <SpellLink id={SPELLS.ERADICATION_DEBUFF.id} /> debuff could be improved. You should try to spread out your <SpellLink id={SPELLS.CHAOS_BOLT.id} /> more for higher uptime.<br /><small><em>NOTE:</em> Uptime may vary based on the encounter.</small></span>)
          .icon(SPELLS.ERADICATION_TALENT.icon)
          .actual(`${formatPercentage(uptime)}% Eradication uptime`)
          .recommended(`>${formatPercentage(recommended)}% is recommended`)
          .regular(recommended - 0.05).major(recommended - 0.15);
      });
  }

  // TODO: SPELL QUEUE ON CAST, SPELLS SNAPSHOT ON CAST, NOT ON HIT SO THIS IS INACCURATE
  on_byPlayer_damage(event) {
    const enemy = this.enemies.getEntity(event);
    if (!enemy || !enemy.hasBuff(SPELLS.ERADICATION_DEBUFF.id, event.timestamp)) {
      return;
    }
    this.bonusDmg += getDamageBonus(event, ERADICATION_DAMAGE_BONUS);
  }

  statistic() {    
        const uptime = this.enemies.getBuffUptime(SPELLS.ERADICATION_DEBUFF.id) / this.owner.fightDuration;
    return (
      <StatisticBox
        icon={<SpellIcon id={SPELLS.ERADICATION_TALENT.id} />}
        value={`${formatPercentage(uptime)} %`}
        label="Eradication uptime"
        tooltip={`Your Eradication talent contributed ${formatNumber(this.bonusDmg)} total damage (${formatPercentage(this.owner.getPercentageOfTotalDamageDone(this.bonusDmg))} %)`}
      />
    );
  }

  statisticOrder = STATISTIC_ORDER.OPTIONAL(2);
}

export default Eradication;
