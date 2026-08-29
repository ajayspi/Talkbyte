variable "oci_region" {
  description = "Oracle Cloud region (e.g., ap-sydney-1)"
  type        = string
}

variable "compartment_id" {
  description = "Oracle Cloud compartment ID"
  type        = string
  sensitive   = true
}

variable "ssh_public_key_path" {
  description = "Path to SSH public key for VM access"
  type        = string
}
