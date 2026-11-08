package vn.tp.radiointelligence.domain.model

data class MagicOsNetworkFlags(
    val linkTurboEnabled: Boolean = false,
    val force5gEnabled: Boolean = false,
    val dual5gEnabled: Boolean = false,
    val smartDualSimEnabled: Boolean = false,
    val mobileDataAlwaysOn: Boolean = false,
    val antiRogueBtsEnabled: Boolean = false
)

